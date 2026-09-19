import { test } from "node:test";
import assert from "node:assert/strict";
import { describeProviders, describeWorkspace } from "./workspace.ts";
import type { Policy } from "./policy.ts";
import { stripAnsi } from "./status.ts";

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

test("describeProviders lists every provider, highest clearance first, with access and the current one marked", () => {
  const lines = describeProviders(policy, "confidential", "google", false);
  assert.ok(lines[0].includes("(confidential)"));
  assert.ok(lines[1].includes("my-openai") && lines[1].includes("✓ cleared"));
  assert.ok(lines[2].includes("google") && lines[2].includes("✗ no access") && lines[2].includes("← current"));
  assert.ok(!lines[1].includes("← current"));
  assert.ok(lines.some((l) => l.includes("not listed is cleared for public")));
});

test("describeProviders says when the current provider is not in the policy", () => {
  const lines = describeProviders(policy, "confidential", "anthropic", false);
  assert.ok(lines.some((l) => l.includes("anthropic is not listed") && l.includes("no access")));
  assert.ok(!describeProviders(policy, "confidential", "google", false).some((l) => l.includes("is not listed:")));
});

test("describeProviders colors levels like the footer, and the columns still line up", () => {
  const colored = describeProviders(policy, "confidential", "google");
  assert.ok(colored[1].includes("\x1b[33mconfidential\x1b[0m"), "middle level is yellow");
  assert.ok(colored[2].includes("\x1b[32mpublic"), "lowest level is green");
  assert.ok(colored[2].includes("\x1b[31m✗ no access\x1b[0m"));
  assert.deepEqual(colored.map(stripAnsi), describeProviders(policy, "confidential", "google", false));
});

test("describeWorkspace always returns the same three lines", () => {
  for (const taint of ["", "public", "confidential", "restricted"]) {
    assert.equal(describeWorkspace(policy, meta, "my-openai", taint).length, 3, taint);
  }
});
