import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { METADATA_NAME } from "./metadata.ts";
import { preflight } from "./preflight.ts";

const POLICY = {
  levels: ["public", "confidential", "restricted"],
  providers: { google: "public", openai: "confidential", mistral: "confidential", ollama: "restricted" },
};

const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ws-guard-preflight-")));
after(() => fs.rmSync(root, { recursive: true, force: true }));

const policyFile = path.join(root, "policy.json");
fs.writeFileSync(policyFile, JSON.stringify(POLICY));

function workspace(name: string, label: unknown): string {
  const dir = path.join(root, name);
  fs.mkdirSync(dir);
  if (label !== undefined) fs.writeFileSync(path.join(dir, METADATA_NAME), JSON.stringify(label));
  return dir;
}

const confidential = workspace("confidential", { level: "confidential" });
const publicWs = workspace("public", { level: "public" });
const restricted = workspace("restricted", { level: "restricted" });

test("a labeled workspace passes and the result lists the providers cleared for its label", () => {
  const r = preflight(policyFile, confidential);
  assert.ok(r.ok);
  assert.equal(r.level, "confidential");
  assert.deepEqual(r.clearedProviders, ["openai", "mistral", "ollama"]);
});

test("the cleared list follows the label: everything for public, only the top tier for restricted", () => {
  const pub = preflight(policyFile, publicWs);
  assert.ok(pub.ok);
  assert.deepEqual(pub.clearedProviders, ["google", "openai", "mistral", "ollama"]);
  const top = preflight(policyFile, restricted);
  assert.ok(top.ok);
  assert.deepEqual(top.clearedProviders, ["ollama"]);
});

test("a workspace no provider is cleared for still passes: the providers are barred in pi, not at launch", () => {
  const onlyGoogle = path.join(root, "only-google.json");
  fs.writeFileSync(onlyGoogle, JSON.stringify({ levels: POLICY.levels, providers: { google: "public" } }));
  const r = preflight(onlyGoogle, confidential);
  assert.ok(r.ok);
  assert.deepEqual(r.clearedProviders, []);
});

test("a missing folder, a missing label and an invalid label are refused", () => {
  assert.equal(preflight(policyFile, path.join(root, "nope")).ok, false);
  assert.equal(preflight(policyFile, workspace("nolabel", undefined)).ok, false);
  assert.equal(preflight(policyFile, workspace("badlevel", { level: "secret" })).ok, false);
  assert.equal(preflight(policyFile, workspace("oldformat", { level: "public", files: {} })).ok, false);
});

test("a label that is a symlink is refused", () => {
  const dir = workspace("linked", undefined);
  fs.symlinkSync(path.join(publicWs, METADATA_NAME), path.join(dir, METADATA_NAME));
  const r = preflight(policyFile, dir);
  assert.ok(!r.ok && r.reason.includes("regular file"));
});

test("a broken or missing policy is refused", () => {
  assert.equal(preflight(path.join(root, "missing.json"), publicWs).ok, false);
  const bad = path.join(root, "bad.json");
  fs.writeFileSync(bad, "{ not json");
  assert.equal(preflight(bad, publicWs).ok, false);
});

test("the command line prints key=value lines and uses the exit code", () => {
  const script = path.join(import.meta.dirname, "preflight.ts");
  const run = (ws: string) =>
    spawnSync(process.execPath, [script, "--policy", policyFile, "--workspace", ws], { encoding: "utf8" });

  const ok = run(confidential);
  assert.equal(ok.status, 0);
  assert.deepEqual(ok.stdout.trim().split("\n"), ["level=confidential", "cleared_providers=openai,mistral,ollama"]);

  const refused = run(path.join(root, "nope"));
  assert.equal(refused.status, 1);
  assert.ok(refused.stderr.includes("not found"));
  assert.equal(refused.stdout, "");

  assert.equal(spawnSync(process.execPath, [script], { encoding: "utf8" }).status, 2);
});
