import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { decideRead, decideWrite } from "./gate.ts";
import type { Env } from "./gate.ts";
import { METADATA_NAME } from "./metadata.ts";
import type { Policy } from "./policy.ts";

const policy: Policy = {
  levels: ["public", "confidential", "restricted"],
  providers: { google: "public", "my-openai": "confidential", ollama: "restricted" },
};

const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ws-guard-gate-")));
const cwd = path.join(root, "project");
const ws = path.join(cwd, "ws");
const outside = path.join(root, "outside");
fs.mkdirSync(path.join(ws, "data"), { recursive: true });
fs.mkdirSync(path.join(ws, "out"));
fs.mkdirSync(outside);
fs.writeFileSync(path.join(ws, "public.txt"), "x");
fs.writeFileSync(path.join(ws, "a b.txt"), "x");
fs.writeFileSync(path.join(ws, "data", "secret.csv"), "x");
fs.writeFileSync(path.join(ws, "out", "report.md"), "x");
fs.writeFileSync(path.join(ws, METADATA_NAME), "{}");
fs.writeFileSync(path.join(outside, "x.txt"), "x");
fs.symlinkSync(outside, path.join(ws, "link"));
after(() => fs.rmSync(root, { recursive: true, force: true }));

const report = path.join(ws, "out", "report.md");

// Every path below is relative to the workspace, which is the agent's working directory.
function env(provider: string | undefined, opts: { level?: string; taint?: string; created?: string[] } = {}): Env {
  return {
    policy,
    meta: { level: opts.level ?? "confidential" },
    workspace: ws,
    provider,
    taint: opts.taint ?? "public",
    created: new Set(opts.created ?? []),
  };
}

test("a provider cleared for the workspace level may read, at its own level or higher", () => {
  for (const provider of ["my-openai", "ollama"]) {
    const r = decideRead(env(provider), "read", "public.txt");
    assert.ok(r.ok, provider);
    assert.equal(r.level, "confidential");
    assert.equal(r.resolved, path.join(ws, "public.txt"));
  }
});

test("a provider cleared below the workspace level gets no access, for every tool", () => {
  for (const tool of ["read", "ls", "find", "grep"]) {
    const r = decideRead(env("google"), tool, "public.txt");
    assert.equal(r.ok, false, tool);
    assert.ok(!r.ok && r.reason.includes("confidential") && r.reason.includes("google"), tool);
  }
});

test("a missing provider is treated as the lowest clearance", () => {
  assert.equal(decideRead(env(undefined), "read", "public.txt").ok, false);
  assert.ok(decideRead(env(undefined, { level: "public" }), "read", "public.txt").ok);
  assert.ok(decideRead(env("google", { level: "public" }), "read", "public.txt").ok);
});

test("every read-only tool raises the session level, because file names are data too", () => {
  for (const [tool, p] of [["read", "public.txt"], ["grep", "data"], ["ls", "data"], ["find", "."]]) {
    assert.equal((decideRead(env("ollama"), tool, p) as any).level, "confidential", tool);
  }
});

test("relative paths are relative to the workspace, not to pi's working directory", () => {
  const cases: [string, string][] = [
    ["public.txt", path.join(ws, "public.txt")],
    ["./public.txt", path.join(ws, "public.txt")],
    ["data/secret.csv", path.join(ws, "data", "secret.csv")],
    ["data/../public.txt", path.join(ws, "public.txt")],
    // a path written relative to the project folder lands inside the workspace and simply does not exist
    ["ws/public.txt", path.join(ws, "ws", "public.txt")],
  ];
  for (const [given, expected] of cases) {
    const r = decideRead(env("ollama"), "read", given);
    assert.ok(r.ok, given);
    assert.equal(r.resolved, expected, given);
  }
});

test("reads outside the workspace are refused", () => {
  for (const p of ["/etc/hostname", "../outside/x.txt", "../../outside/x.txt", "~/x.txt", "../README.md", ".."]) {
    assert.equal(decideRead(env("ollama"), "read", p).ok, false, p);
  }
});

test("a symlink out of the workspace cannot be read through", () => {
  assert.equal(decideRead(env("ollama"), "read", "link/x.txt").ok, false);
});

test("pi's path quirks are normalised before checking: leading @ and unicode spaces", () => {
  const at = decideRead(env("ollama"), "read", `@${path.join(ws, "public.txt")}`);
  assert.ok(at.ok);
  assert.equal(at.resolved, path.join(ws, "public.txt"));

  const space = decideRead(env("ollama"), "read", "a b.txt");
  assert.ok(space.ok);
  assert.equal(space.resolved, path.join(ws, "a b.txt"));
});

test("an omitted path or a dot means the workspace for ls, find and grep; read needs a real path", () => {
  assert.equal(decideRead(env("ollama"), "read", undefined).ok, false);
  for (const tool of ["ls", "find", "grep"]) {
    for (const given of [undefined, "", ".", "./"]) {
      const r = decideRead(env("ollama"), tool, given);
      assert.ok(r.ok, `${tool} ${String(given)}`);
      assert.equal(r.resolved, ws);
    }
  }
});

test("a path that does not exist inside the workspace is allowed, since there is nothing to read", () => {
  assert.ok(decideRead(env("ollama"), "read", "nope.txt").ok);
});

test("a cleared provider may create a new file, also in a folder that does not exist yet", () => {
  const r = decideWrite(env("my-openai"), "write", "new.md");
  assert.ok(r.ok);
  assert.equal(r.resolved, path.join(ws, "new.md"));
  assert.equal(r.readLevel, undefined);

  const nested = decideWrite(env("my-openai"), "write", "sub/dir/new.md");
  assert.ok(nested.ok);
  assert.equal(nested.resolved, path.join(ws, "sub", "dir", "new.md"));
});

test("writing above the provider's clearance is refused", () => {
  const r = decideWrite(env("google"), "write", "new.md");
  assert.equal(r.ok, false);
  assert.ok(!r.ok && r.reason.includes("google"));
  assert.ok(decideWrite(env("google", { level: "public" }), "write", "new.md").ok);
});

test("a session above the workspace level may not write there, because that would lower the label", () => {
  const r = decideWrite(env("ollama", { level: "confidential", taint: "restricted" }), "write", "new.md");
  assert.equal(r.ok, false);
  assert.ok(!r.ok && r.reason.includes("above the workspace"));
  assert.ok(decideWrite(env("ollama", { level: "confidential", taint: "confidential" }), "write", "new.md").ok);
  assert.ok(decideWrite(env("ollama", { level: "confidential", taint: "public" }), "write", "new.md").ok);
});

test("existing files are read-only unless the agent created them", () => {
  for (const p of ["public.txt", "data/secret.csv", "out/report.md"]) {
    const r = decideWrite(env("ollama"), "write", p);
    assert.equal(r.ok, false, p);
    assert.ok(!r.ok && r.reason.includes("read-only"));
  }
  assert.equal(decideWrite(env("ollama"), "edit", "public.txt").ok, false);
  assert.ok(decideWrite(env("ollama", { created: [report] }), "write", "out/report.md").ok);
});

test("editing counts as a read, so it reports the workspace level", () => {
  const r = decideWrite(env("ollama", { created: [report] }), "edit", "out/report.md");
  assert.ok(r.ok);
  assert.equal(r.readLevel, "confidential");
});

test("the metadata file is protected at any depth", () => {
  for (const p of [METADATA_NAME, `./${METADATA_NAME}`, `sub/${METADATA_NAME}`, path.join(ws, METADATA_NAME)]) {
    const r = decideWrite(env("ollama"), "write", p);
    assert.equal(r.ok, false, p);
    assert.ok(!r.ok && r.reason.includes("protected"));
  }
});

test("writes outside the workspace or to the workspace folder itself are refused", () => {
  for (const p of ["../README.md", "/etc/x", "../outside/y.txt", ".", "", "link/y.txt"]) {
    assert.equal(decideWrite(env("ollama"), "write", p).ok, false, JSON.stringify(p));
  }
});
