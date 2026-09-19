import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { METADATA_NAME } from "./metadata.ts";
import { activateWorkspace, describeWorkspace } from "./workspace.ts";

const POLICY = {
  levels: ["public", "confidential", "restricted"],
  providers: { google: "public", "my-openai": "confidential" },
};
const META = { level: "confidential" };

const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ws-guard-workspace-")));
const cwd = path.join(root, "project");
const other = path.join(root, "other");
after(() => fs.rmSync(root, { recursive: true, force: true }));

fs.mkdirSync(path.join(cwd, ".pi", "sub"), { recursive: true });
fs.mkdirSync(path.join(cwd, ".git", "x"), { recursive: true });
fs.mkdirSync(path.join(cwd, "good"));
fs.mkdirSync(path.join(cwd, "nometa"));
fs.mkdirSync(path.join(cwd, "badmeta"));
fs.mkdirSync(path.join(cwd, "oldformat"));
fs.mkdirSync(other);
fs.writeFileSync(path.join(cwd, ".pi", "confidentiality.json"), JSON.stringify(POLICY));
fs.writeFileSync(path.join(cwd, ".pi", "sub", METADATA_NAME), JSON.stringify(META));
fs.writeFileSync(path.join(cwd, ".git", "x", METADATA_NAME), JSON.stringify(META));
fs.writeFileSync(path.join(cwd, "good", METADATA_NAME), JSON.stringify(META));
fs.writeFileSync(path.join(cwd, "badmeta", METADATA_NAME), "{");
fs.writeFileSync(
  path.join(cwd, "oldformat", METADATA_NAME),
  JSON.stringify({ level: "public", files: { "a/**": "confidential" } }),
);

test("a folder with valid metadata is activated", () => {
  const r = activateWorkspace("good", cwd);
  assert.ok(r.ok);
  assert.equal(r.value.workspace, path.join(cwd, "good"));
  assert.equal(r.value.meta.level, "confidential");
  assert.deepEqual(r.value.policy.levels, POLICY.levels);
});

test("a folder without a metadata file is refused", () => {
  const r = activateWorkspace("nometa", cwd);
  assert.equal(r.ok, false);
  assert.ok(!r.ok && r.reason.includes(METADATA_NAME));
});

test("a folder with invalid or old-format metadata is refused", () => {
  assert.equal(activateWorkspace("badmeta", cwd).ok, false);
  const old = activateWorkspace("oldformat", cwd);
  assert.equal(old.ok, false);
  assert.ok(!old.ok && old.reason.includes("single label"));
});

test("protected project folders cannot be a workspace, even with metadata", () => {
  assert.equal(activateWorkspace(".pi/sub", cwd).ok, false);
  assert.equal(activateWorkspace(".git/x", cwd).ok, false);
});

test("the project folder and a missing folder are refused", () => {
  assert.equal(activateWorkspace(".", cwd).ok, false);
  assert.equal(activateWorkspace("missing", cwd).ok, false);
});

test("without a policy file nothing can be activated", () => {
  fs.mkdirSync(path.join(other, "w"));
  fs.writeFileSync(path.join(other, "w", METADATA_NAME), JSON.stringify(META));
  const r = activateWorkspace("w", other);
  assert.equal(r.ok, false);
  assert.ok(!r.ok && r.reason.includes("confidentiality.json"));
});

test("describeWorkspace shows the label, the provider's clearance and whether access is allowed", () => {
  const r = activateWorkspace("good", cwd);
  assert.ok(r.ok);
  const { policy, meta } = r.value;

  const google = describeWorkspace(policy, meta, "google", "");
  assert.ok(google[0].includes("Workspace level: confidential"));
  assert.ok(google[1].includes("google") && google[1].includes("cleared for public"));
  assert.ok(google[1].includes("all file access will be refused"));
  assert.ok(google[2].includes("Session level: public"));

  const mine = describeWorkspace(policy, meta, "my-openai", "confidential");
  assert.ok(mine[1].includes("file access is allowed"));
  assert.ok(mine[2].includes("Session level: confidential"));

  assert.ok(describeWorkspace(policy, meta, undefined, "")[1].includes("(none)"));
});

test("describeWorkspace warns that writes are disabled only when the session level is above the workspace label", () => {
  const r = activateWorkspace("good", cwd);
  assert.ok(r.ok);
  const { policy, meta } = r.value;
  const highest = policy.levels[policy.levels.length - 1];
  assert.ok(highest !== meta.level, "the fixture needs a level above the workspace label");

  assert.equal(describeWorkspace(policy, meta, "my-openai", "").length, 3);
  assert.equal(describeWorkspace(policy, meta, "my-openai", meta.level).length, 3);

  const above = describeWorkspace(policy, meta, "my-openai", highest);
  assert.equal(above.length, 4);
  assert.ok(above[3].includes("Writes are disabled") && above[3].includes("/new"));
});
