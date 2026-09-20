import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { isSandboxed, loadConfig } from "./config.ts";

const POLICY = { levels: ["public", "confidential", "restricted"], providers: { google: "public" } };

const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ws-guard-config-")));
after(() => fs.rmSync(root, { recursive: true, force: true }));

const policyFile = path.join(root, "policy.json");
const workspace = path.join(root, "workspace");
const link = path.join(root, "link");
const file = path.join(root, "afile");
fs.writeFileSync(policyFile, JSON.stringify(POLICY));
fs.mkdirSync(workspace);
fs.symlinkSync(workspace, link);
fs.writeFileSync(file, "x");

const good = {
  PI_POLICY_FILE: policyFile,
  PI_WORKSPACE: workspace,
  PI_WORKSPACE_LEVEL: "confidential",
  PI_SANDBOXED: "1",
};

test("the launcher's environment gives the policy, the real workspace path, its label and the sandbox flag", () => {
  const r = loadConfig(good);
  assert.ok(r.ok);
  assert.deepEqual(r.value.policy, POLICY);
  assert.equal(r.value.workspace, workspace);
  assert.deepEqual(r.value.meta, { level: "confidential" });
  assert.equal(r.value.sandboxed, true);
});

test("the workspace is resolved to its real path", () => {
  const r = loadConfig({ ...good, PI_WORKSPACE: link });
  assert.ok(r.ok);
  assert.equal(r.value.workspace, workspace);
});

test("only PI_SANDBOXED=1 counts as sandboxed", () => {
  for (const value of [undefined, "", "0", "true", "yes"]) {
    assert.equal(isSandboxed({ PI_SANDBOXED: value }), false, String(value));
    const r = loadConfig({ ...good, PI_SANDBOXED: value });
    assert.ok(r.ok && r.value.sandboxed === false, String(value));
  }
  assert.equal(isSandboxed({ PI_SANDBOXED: "1" }), true);
});

test("every missing or invalid variable fails closed, and the reason says how to launch", () => {
  const bad: Record<string, NodeJS.ProcessEnv> = {
    "no policy variable": { ...good, PI_POLICY_FILE: undefined },
    "policy file missing": { ...good, PI_POLICY_FILE: path.join(root, "nope.json") },
    "no workspace variable": { ...good, PI_WORKSPACE: undefined },
    "relative workspace": { ...good, PI_WORKSPACE: "workspace" },
    "workspace does not exist": { ...good, PI_WORKSPACE: path.join(root, "gone") },
    "workspace is a file": { ...good, PI_WORKSPACE: file },
    "no level": { ...good, PI_WORKSPACE_LEVEL: undefined },
    "unknown level": { ...good, PI_WORKSPACE_LEVEL: "secret" },
  };
  for (const [name, env] of Object.entries(bad)) {
    const r = loadConfig(env);
    assert.equal(r.ok, false, name);
  }
  const noEnv = loadConfig({});
  assert.ok(!noEnv.ok && noEnv.reason.includes("scripts/launch.sh"));
});

test("a broken policy file is refused", () => {
  const broken = path.join(root, "broken.json");
  fs.writeFileSync(broken, "{ nope");
  assert.equal(loadConfig({ ...good, PI_POLICY_FILE: broken }).ok, false);
});
