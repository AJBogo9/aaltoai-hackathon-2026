import { test } from "node:test";
import assert from "node:assert/strict";
import { levelColor, statusLine, stripAnsi } from "./status.ts";
import type { StatusInput } from "./status.ts";
import type { Policy } from "./policy.ts";

const policy: Policy = {
  levels: ["public", "confidential", "restricted"],
  providers: { google: "public", "my-openai": "confidential", ollama: "restricted" },
};

const base: StatusInput = {
  policy,
  workspace: "/repo/data/mock-workspace",
  level: "confidential",
  provider: "google",
  taint: "public",
};

test("the line shows the workspace label, the provider's clearance and the session level", () => {
  assert.equal(
    statusLine(base, false),
    "● mock-workspace [confidential]  ·  google [public] ✗ no access  ·  session public",
  );
});

test("a cleared provider gets a check mark", () => {
  assert.equal(
    statusLine({ ...base, provider: "my-openai", taint: "confidential" }, false),
    "● mock-workspace [confidential]  ·  my-openai [confidential] ✓  ·  session confidential",
  );
});

test("a session above the provider's clearance says messages are withheld", () => {
  const line = statusLine({ ...base, taint: "confidential" }, false);
  assert.ok(line.endsWith("session confidential ⛔ messages withheld"));
  assert.ok(!statusLine({ ...base, provider: "ollama", taint: "confidential" }, false).includes("withheld"));
});

test("with no workspace only the provider and the session level are shown", () => {
  assert.equal(
    statusLine({ policy, provider: "google", taint: "public" }, false),
    "○ no workspace  ·  google [public]  ·  session public",
  );
});

test("a missing provider is shown as none and gets the lowest clearance", () => {
  assert.ok(statusLine({ ...base, provider: undefined }, false).includes("none [public] ✗ no access"));
});

test("an unusable policy or metadata is reported briefly", () => {
  const line = statusLine({ problem: "No .pi/confidentiality.json found." }, false);
  assert.equal(line, "✗ confidentiality unusable (run /confidentiality)");
  assert.equal(statusLine({}, false), line);
});

test("colors are optional and never change the text", () => {
  for (const input of [base, { ...base, provider: "ollama" }, { policy, taint: "restricted" }, { problem: "x" }]) {
    const colored = statusLine(input, true);
    assert.ok(colored.includes("\x1b["));
    assert.equal(stripAnsi(colored), statusLine(input, false));
  }
  assert.ok(!statusLine(base, false).includes("\x1b"));
});

test("levels are colored from green at the bottom to red at the top", () => {
  assert.equal(levelColor(policy, "public"), "green");
  assert.equal(levelColor(policy, "confidential"), "yellow");
  assert.equal(levelColor(policy, "restricted"), "red");
  assert.equal(levelColor(policy, "unknown"), "red");
  assert.equal(levelColor({ levels: ["only"], providers: {} }, "only"), "green");
});
