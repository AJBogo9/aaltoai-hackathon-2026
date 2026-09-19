import { test } from "node:test";
import assert from "node:assert/strict";
import { workspaceNote, withWorkspaceNote } from "./prompt.ts";
import { BLOCKED_TOOLS, READ_ONLY_TOOLS, WRITE_TOOLS } from "./rules.ts";

const BASE = "You are a coding agent.\n\nTools: read, write.";

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
    const note = workspaceNote(workspace);
    assert.ok(note.includes("Rules enforced on every tool call"));
    for (const name of [...READ_ONLY_TOOLS, ...WRITE_TOOLS, ...BLOCKED_TOOLS]) {
      assert.ok(note.includes(name), `note should name ${name}`);
    }
    assert.ok(note.includes("symlinks"));
    assert.ok(note.includes("do not try to work around it"));
  }
});

test("the section has no blank line, which replacing it relies on", () => {
  assert.ok(!workspaceNote(undefined).includes("\n\n"));
  assert.ok(!workspaceNote("/work/a").includes("\n\n"));
});

test("changing the workspace replaces the old folder", () => {
  const out = withWorkspaceNote(withWorkspaceNote(BASE, "/work/a"), "/work/b");
  assert.ok(out.includes("/work/b"));
  assert.ok(!out.includes("/work/a"));
  assert.equal(count(out, "## Workspace"), 1);
  assert.equal(count(out, "Rules enforced"), 1);
});

test("applying it twice gives the same result as applying it once", () => {
  const once = withWorkspaceNote(BASE, "/work/a");
  assert.equal(withWorkspaceNote(once, "/work/a"), once);
});

test("text another extension appended after the workspace section is kept", () => {
  const withOther = `${withWorkspaceNote(BASE, "/work/a")}\n\n## Other\nkeep me`;
  const out = withWorkspaceNote(withOther, "/work/b");
  assert.ok(out.includes("keep me"));
  assert.ok(out.includes("/work/b"));
});
