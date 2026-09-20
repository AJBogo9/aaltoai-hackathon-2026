import { test } from "node:test";
import assert from "node:assert/strict";
import { levelColor, paint, setTruecolor, statusLine, stripAnsi, supportsTruecolor } from "./status.ts";
import { BASIC, RGB } from "./brand.generated.ts";
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

test("the lowest level is painted allow, the highest refuse, everything between", () => {
  assert.equal(levelColor(policy, "public"), "allow");
  assert.equal(levelColor(policy, "confidential"), "between");
  assert.equal(levelColor(policy, "restricted"), "refuse");
  assert.equal(levelColor(policy, "unknown"), "refuse");
  assert.equal(levelColor({ levels: ["only"], providers: {} }, "only"), "allow");
});

test("a truecolor terminal prints the level colours the deck quotes", () => {
  setTruecolor(true);
  const escape = (name: keyof typeof RGB) => `\x1b[38;2;${RGB[name].join(";")}m`;
  assert.equal(paint("public", "allow", true), `${escape("allow")}public\x1b[0m`);
  assert.equal(paint("confidential", "between", true), `${escape("between")}confidential\x1b[0m`);
  assert.equal(paint("restricted", "refuse", true), `${escape("refuse")}restricted\x1b[0m`);
  // The footer is the one element a slide quotes verbatim, so its middle level has to be
  // the confidential blue of the band and not a fourth colour.
  assert.ok(statusLine(base, true).includes(`${escape("between")}[confidential]\x1b[0m`));
});

test("a terminal that does not report truecolor falls back to 4 bit", () => {
  setTruecolor(false);
  assert.equal(paint("public", "allow", true), `${BASIC.allow}public\x1b[0m`);
  assert.equal(paint("confidential", "between", true), `${BASIC.between}confidential\x1b[0m`);
  assert.ok(!statusLine(base, true).includes("38;2;"));
  setTruecolor(supportsTruecolor());
});

test("truecolor is read from COLORTERM, and anything else is 4 bit", () => {
  assert.ok(supportsTruecolor({ COLORTERM: "truecolor" }));
  assert.ok(supportsTruecolor({ COLORTERM: "24bit" }));
  assert.ok(!supportsTruecolor({ COLORTERM: "" }));
  assert.ok(!supportsTruecolor({}));
});
