import { test } from "node:test";
import assert from "node:assert/strict";
import { workspaceNote, withWorkspaceNote } from "./prompt.ts";
import type { ConfInfo } from "./prompt.ts";
import { BLOCKED_TOOLS, READ_ONLY_TOOLS, WRITE_TOOLS } from "./rules.ts";

const BASE = "You are a coding agent.\n\nTools: read, write.";
const CONF: ConfInfo = { provider: "google", clearance: "public", taint: "public", level: "confidential" };

function count(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

test("without a workspace the prompt says none is set and keeps the base prompt", () => {
  const out = withWorkspaceNote(BASE, undefined);
  assert.ok(out.startsWith(BASE));
  assert.ok(out.includes("No workspace is set"));
});

test("with a workspace the prompt names the folder and keeps the base prompt", () => {
  const out = withWorkspaceNote(BASE, "/work/a");
  assert.ok(out.startsWith(BASE));
  assert.ok(out.includes("/work/a"));
  assert.ok(!out.includes("No workspace is set"));
});

test("the section states the rules and names every tool the guard handles", () => {
  for (const workspace of [undefined, "/work/a"]) {
    const note = workspaceNote(workspace, CONF);
    assert.ok(note.includes("Rules enforced on every tool call"));
    for (const name of [...READ_ONLY_TOOLS, ...WRITE_TOOLS, ...BLOCKED_TOOLS]) {
      assert.ok(note.includes(name), `note should name ${name}`);
    }
    assert.ok(note.includes("symlinks"));
    assert.ok(note.includes("read-only source data"));
    assert.ok(note.includes(".confidentiality.json is protected"));
    assert.ok(note.includes("do not try to work around it"));
  }
});

test("the section tells the model the workspace label, the session level and the provider's clearance", () => {
  const note = workspaceNote("/work/a", { ...CONF, taint: "confidential" });
  assert.ok(note.includes("every file and folder in the workspace is labeled confidential"));
  assert.ok(note.includes("This session is at level confidential"));
  assert.ok(note.includes("(google) is cleared up to public"));
  assert.ok(note.includes("every file tool is refused"));
  assert.ok(note.includes("data never moves to a lower label"));
});

test("with no workspace the section still reports the session level and clearance", () => {
  const note = workspaceNote(undefined, { ...CONF, level: undefined });
  assert.ok(note.includes("this session is at level public"));
  assert.ok(!note.includes("every file and folder in the workspace is labeled"));
});

test("a missing provider is described as none", () => {
  const note = workspaceNote("/work/a", { ...CONF, provider: undefined });
  assert.ok(note.includes("(none)"));
});

test("an unusable policy is reported and blocks everything", () => {
  const note = workspaceNote("/work/a", { problem: "No .pi/confidentiality.json found.\nSecond line." });
  assert.ok(note.includes("could not be used"));
  assert.ok(note.includes("No .pi/confidentiality.json found. Second line."));
  assert.ok(!note.includes("This session is at level"));
});

test("the section has no blank line, which replacing it relies on", () => {
  assert.ok(!workspaceNote(undefined).includes("\n\n"));
  assert.ok(!workspaceNote("/work/a", CONF).includes("\n\n"));
  assert.ok(!workspaceNote("/work/a", { ...CONF, level: undefined }).includes("\n\n"));
  assert.ok(!workspaceNote("/work/a", { problem: "a\n\nb" }).includes("\n\n"));
});

test("changing the workspace replaces the old folder", () => {
  const out = withWorkspaceNote(withWorkspaceNote(BASE, "/work/a", CONF), "/work/b", CONF);
  assert.ok(out.includes("/work/b"));
  assert.ok(!out.includes("/work/a"));
  assert.equal(count(out, "## Workspace"), 1);
  assert.equal(count(out, "Rules enforced"), 1);
});

test("applying it twice gives the same result as applying it once", () => {
  const once = withWorkspaceNote(BASE, "/work/a", CONF);
  assert.equal(withWorkspaceNote(once, "/work/a", CONF), once);
});

test("text another extension appended after the workspace section is kept", () => {
  const withOther = `${withWorkspaceNote(BASE, "/work/a", CONF)}\n\n## Other\nkeep me`;
  const out = withWorkspaceNote(withOther, "/work/b", CONF);
  assert.ok(out.includes("keep me"));
  assert.ok(out.includes("/work/b"));
});
