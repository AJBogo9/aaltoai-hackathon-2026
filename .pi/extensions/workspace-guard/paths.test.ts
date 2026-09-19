import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { checkWritePath, resolveWorkspace } from "./paths.ts";

const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ws-guard-")));
const cwd = path.join(base, "project");
const ws = path.join(cwd, "workspace");
const outside = path.join(base, "outside");

fs.mkdirSync(ws, { recursive: true });
fs.mkdirSync(path.join(cwd, "workspace-evil"));
fs.mkdirSync(outside);
fs.writeFileSync(path.join(cwd, "afile"), "x");
fs.symlinkSync(outside, path.join(ws, "escape"));
fs.symlinkSync(path.join(outside, "nope.txt"), path.join(ws, "dangling"));

after(() => fs.rmSync(base, { recursive: true, force: true }));

test("resolveWorkspace accepts an existing folder below cwd", () => {
  const r = resolveWorkspace("workspace", cwd);
  assert.ok(r.ok);
  assert.equal(r.resolved, ws);
});

test("resolveWorkspace rejects missing folders, files and empty input", () => {
  assert.equal(resolveWorkspace("nope", cwd).ok, false);
  assert.equal(resolveWorkspace("afile", cwd).ok, false);
  assert.equal(resolveWorkspace("   ", cwd).ok, false);
});

test("resolveWorkspace rejects cwd, its parents and the filesystem root", () => {
  assert.equal(resolveWorkspace(".", cwd).ok, false);
  assert.equal(resolveWorkspace("..", cwd).ok, false);
  assert.equal(resolveWorkspace("/", cwd).ok, false);
});

test("relative path inside the workspace is allowed, even when new and nested", () => {
  const r = checkWritePath(ws, "workspace/notes/a.txt", cwd);
  assert.ok(r.ok);
  assert.equal(r.resolved, path.join(ws, "notes", "a.txt"));
});

test("absolute path inside the workspace is allowed", () => {
  const r = checkWritePath(ws, path.join(ws, "a.txt"), cwd);
  assert.ok(r.ok);
  assert.equal(r.resolved, path.join(ws, "a.txt"));
});

test("paths outside the workspace are blocked", () => {
  assert.equal(checkWritePath(ws, "README.md", cwd).ok, false);
  assert.equal(checkWritePath(ws, "/etc/passwd", cwd).ok, false);
  assert.equal(checkWritePath(ws, "~/x.txt", cwd).ok, false);
  assert.equal(checkWritePath(ws, "../outside/x.txt", cwd).ok, false);
});

test("dot-dot traversal out of the workspace is blocked", () => {
  assert.equal(checkWritePath(ws, "workspace/../x.txt", cwd).ok, false);
});

test("a sibling folder that shares the workspace name prefix is blocked", () => {
  assert.equal(checkWritePath(ws, "workspace-evil/x.txt", cwd).ok, false);
});

test("a symlink inside the workspace that points outside is blocked", () => {
  assert.equal(checkWritePath(ws, "workspace/escape/x.txt", cwd).ok, false);
});

test("a dangling symlink inside the workspace is blocked", () => {
  assert.equal(checkWritePath(ws, "workspace/dangling", cwd).ok, false);
});

test("the workspace folder itself is blocked", () => {
  assert.equal(checkWritePath(ws, "workspace", cwd).ok, false);
});

test("empty and non-string paths are blocked", () => {
  assert.equal(checkWritePath(ws, "", cwd).ok, false);
  assert.equal(checkWritePath(ws, undefined, cwd).ok, false);
  assert.equal(checkWritePath(ws, 42, cwd).ok, false);
});
