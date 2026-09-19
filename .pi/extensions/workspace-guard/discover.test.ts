import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { findWorkspaces, pickerLabel } from "./discover.ts";
import { METADATA_NAME } from "./metadata.ts";
import type { Policy } from "./policy.ts";

const policy: Policy = { levels: ["public", "confidential", "restricted"], providers: {} };

const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ws-guard-discover-")));
after(() => fs.rmSync(root, { recursive: true, force: true }));

function label(dir: string, content: unknown): void {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, METADATA_NAME), typeof content === "string" ? content : JSON.stringify(content));
}

const tree = path.join(root, "tree");
label(path.join(tree, "a"), { level: "public" });
label(path.join(tree, "a", "sub"), { level: "confidential" });
label(path.join(tree, "b", "deep", "er", "est"), { level: "public" }); // four levels down
label(path.join(tree, ".hidden"), { level: "public" });
label(path.join(tree, "node_modules", "x"), { level: "public" });
label(path.join(tree, "bad"), "{");
label(path.join(tree, "old"), { level: "public", files: {} });
label(tree, { level: "public" }); // the root itself is never listed
fs.mkdirSync(path.join(tree, "c"));
fs.symlinkSync(path.join(tree, "a"), path.join(tree, "link"));

test("finds folders with a valid metadata file, sorted, with their labels", () => {
  const found = findWorkspaces(tree, policy);
  assert.deepEqual(
    found.map((c) => [c.rel, c.level]),
    [
      ["a", "public"],
      ["a/sub", "confidential"],
    ],
  );
  assert.equal(found[0].abs, path.join(tree, "a"));
});

test("skips hidden folders, build folders, symlinks, invalid metadata and folders that are too deep", () => {
  const rels = findWorkspaces(tree, policy).map((c) => c.rel);
  for (const skipped of [".hidden", "node_modules/x", "bad", "old", "link", "b/deep/er/est", "c", ""]) {
    assert.ok(!rels.includes(skipped), skipped);
  }
});

test("the result list is capped", () => {
  const many = path.join(root, "many");
  for (let i = 0; i < 60; i += 1) label(path.join(many, `w${String(i).padStart(2, "0")}`), { level: "public" });
  assert.equal(findWorkspaces(many, policy).length, 50);
});

test("a missing folder gives an empty list", () => {
  assert.deepEqual(findWorkspaces(path.join(root, "nope"), policy), []);
});

test("pickerLabel shows the label, whether the provider may use the folder, and the current one", () => {
  const c = { rel: "data/mock", abs: "/x/data/mock", level: "confidential" };
  assert.equal(pickerLabel(c, true, false), "data/mock  [confidential]  ✓");
  assert.equal(pickerLabel(c, false, false), "data/mock  [confidential]  ✗ no access");
  assert.equal(pickerLabel(c, true, true), "data/mock  [confidential]  ✓  (current)");
});
