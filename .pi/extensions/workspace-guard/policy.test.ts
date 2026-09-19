import { test } from "node:test";
import assert from "node:assert/strict";
import { clearanceOf, cleared, highest, lowest, maxLevel, normalizeLevel, parsePolicy } from "./policy.ts";
import type { Policy } from "./policy.ts";

const policy: Policy = {
  levels: ["public", "confidential", "restricted"],
  providers: { google: "public", "my-openai": "confidential", ollama: "restricted" },
};

test("parsePolicy accepts a valid policy", () => {
  const r = parsePolicy({ levels: ["a", "b"], providers: { x: "b" } });
  assert.ok(r.ok);
  assert.deepEqual(r.value.levels, ["a", "b"]);
  assert.equal(r.value.providers.x, "b");
});

test("providers are optional", () => {
  const r = parsePolicy({ levels: ["a"] });
  assert.ok(r.ok);
  assert.deepEqual(r.value.providers, {});
});

test("parsePolicy rejects bad levels", () => {
  assert.equal(parsePolicy({ levels: [] }).ok, false);
  assert.equal(parsePolicy({ levels: ["a", "a"] }).ok, false);
  assert.equal(parsePolicy({ levels: ["a", ""] }).ok, false);
  assert.equal(parsePolicy({ levels: "a" }).ok, false);
  assert.equal(parsePolicy({}).ok, false);
});

test("parsePolicy rejects a provider with an unknown level", () => {
  assert.equal(parsePolicy({ levels: ["a"], providers: { x: "z" } }).ok, false);
  assert.equal(parsePolicy({ levels: ["a"], providers: { x: 1 } }).ok, false);
});

test("parsePolicy rejects a non-object", () => {
  assert.equal(parsePolicy(null).ok, false);
  assert.equal(parsePolicy([]).ok, false);
  assert.equal(parsePolicy("x").ok, false);
});

test("levels are ordered lowest to highest", () => {
  assert.equal(lowest(policy), "public");
  assert.equal(highest(policy), "restricted");
  assert.equal(maxLevel(policy, "public", "confidential"), "confidential");
  assert.equal(maxLevel(policy, "restricted", "confidential"), "restricted");
});

test("a provider may see data at its own level or below, not above", () => {
  assert.equal(cleared(policy, "confidential", "confidential"), true);
  assert.equal(cleared(policy, "confidential", "public"), true);
  assert.equal(cleared(policy, "confidential", "restricted"), false);
  assert.equal(cleared(policy, "public", "confidential"), false);
  assert.equal(cleared(policy, "restricted", "public"), true);
});

test("unknown or missing providers get the lowest clearance", () => {
  assert.equal(clearanceOf(policy, "google"), "public");
  assert.equal(clearanceOf(policy, "ollama"), "restricted");
  assert.equal(clearanceOf(policy, "nope"), "public");
  assert.equal(clearanceOf(policy, undefined), "public");
  assert.equal(clearanceOf(policy, "constructor"), "public");
  assert.equal(clearanceOf(policy, "__proto__"), "public");
});

test("normalizeLevel: empty is the lowest, unknown fails closed to the highest", () => {
  assert.equal(normalizeLevel(policy, ""), "public");
  assert.equal(normalizeLevel(policy, "confidential"), "confidential");
  assert.equal(normalizeLevel(policy, "top-secret"), "restricted");
});
