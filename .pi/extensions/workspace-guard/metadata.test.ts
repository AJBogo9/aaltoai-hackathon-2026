import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { METADATA_NAME, loadMetadata, parseMetadata, toRel } from "./metadata.ts";
import type { Policy } from "./policy.ts";

const policy: Policy = { levels: ["public", "confidential", "restricted"], providers: {} };

const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ws-guard-meta-")));
after(() => fs.rmSync(root, { recursive: true, force: true }));

test("parseMetadata accepts a single level from the policy", () => {
  const r = parseMetadata({ level: "confidential" }, policy);
  assert.ok(r.ok);
  assert.deepEqual(r.value, { level: "confidential" });
});

test("parseMetadata rejects a missing, unknown or non-string level", () => {
  assert.equal(parseMetadata({}, policy).ok, false);
  assert.equal(parseMetadata({ level: "secret" }, policy).ok, false);
  assert.equal(parseMetadata({ level: 1 }, policy).ok, false);
});

test("parseMetadata rejects per-file rules and other keys, so nothing looks enforced that is not", () => {
  for (const extra of [{ files: {} }, { default: "public" }, { artifacts: {} }, { note: "x" }]) {
    const r = parseMetadata({ level: "public", ...extra }, policy);
    assert.equal(r.ok, false);
    assert.ok(!r.ok && r.reason.includes("single label"));
  }
});

test("parseMetadata rejects anything that is not an object", () => {
  assert.equal(parseMetadata(null, policy).ok, false);
  assert.equal(parseMetadata([], policy).ok, false);
  assert.equal(parseMetadata("confidential", policy).ok, false);
});

test("loadMetadata reports a missing file, bad JSON and a valid file", () => {
  const dir = path.join(root, "load");
  fs.mkdirSync(dir);
  const missing = loadMetadata(dir, policy);
  assert.equal(missing.ok, false);
  assert.ok(!missing.ok && missing.reason.includes(METADATA_NAME));

  fs.writeFileSync(path.join(dir, METADATA_NAME), "{");
  const bad = loadMetadata(dir, policy);
  assert.equal(bad.ok, false);
  assert.ok(!bad.ok && bad.reason.includes("not valid JSON"));

  fs.writeFileSync(path.join(dir, METADATA_NAME), JSON.stringify({ level: "restricted" }));
  const good = loadMetadata(dir, policy);
  assert.ok(good.ok);
  assert.equal(good.value.level, "restricted");
});

test("toRel gives a forward-slash path relative to the workspace", () => {
  assert.equal(toRel("/w", "/w/a/b.txt"), "a/b.txt");
  assert.equal(toRel("/w", "/w"), "");
});
