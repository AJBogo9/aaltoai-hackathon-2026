import { test } from "node:test";
import assert from "node:assert/strict";
import { describeWorkspace } from "./workspace.ts";
import type { Policy } from "./policy.ts";

const policy: Policy = {
  levels: ["public", "confidential", "restricted"],
  providers: { google: "public", "my-openai": "confidential" },
};
const meta = { level: "confidential" };

test("describeWorkspace shows the label, the provider's clearance and whether tools are allowed", () => {
  const google = describeWorkspace(policy, meta, "google", "");
  assert.ok(google[0].includes("Workspace level: confidential"));
  assert.ok(google[1].includes("google") && google[1].includes("cleared for public"));
  assert.ok(google[1].includes("every tool will be refused"));
  assert.ok(google[2].includes("Session level: public"));

  const mine = describeWorkspace(policy, meta, "my-openai", "confidential");
  assert.ok(mine[1].includes("tools are allowed"));
  assert.ok(mine[2].includes("Session level: confidential"));

  assert.ok(describeWorkspace(policy, meta, undefined, "")[1].includes("(none)"));
});

test("describeWorkspace always returns the same three lines", () => {
  for (const taint of ["", "public", "confidential", "restricted"]) {
    assert.equal(describeWorkspace(policy, meta, "my-openai", taint).length, 3, taint);
  }
});
