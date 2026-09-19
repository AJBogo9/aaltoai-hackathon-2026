import { test } from "node:test";
import assert from "node:assert/strict";
import { workspaceNote, withWorkspaceNote } from "./prompt.ts";
import type { ConfInfo } from "./prompt.ts";
import { READ_ONLY_TOOLS, SHELL_TOOLS, WRITE_TOOLS } from "./rules.ts";

const BASE = "You are a coding agent.\n\nTools: read, write.";
const CONF: ConfInfo = {
  provider: "my-openai",
  clearance: "confidential",
  taint: "public",
  level: "confidential",
  allowed: true,
  shell: true,
};
const NO_ACCESS: ConfInfo = {
  provider: "google",
  clearance: "public",
  taint: "public",
  level: "confidential",
  allowed: false,
  shell: true,
};

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
  assert.ok(out.includes("You may create and modify files only inside this folder: /work/a"));
  assert.ok(!out.includes("No workspace is set"));
});

test("the section states the rules and names every tool the guard handles", () => {
  for (const workspace of [undefined, "/work/a"]) {
    const note = workspaceNote(workspace, CONF);
    assert.ok(note.includes("Rules enforced on every tool call"));
    for (const name of [...READ_ONLY_TOOLS, ...WRITE_TOOLS, ...SHELL_TOOLS]) {
      assert.ok(note.includes(name), `note should name ${name}`);
    }
    assert.ok(note.includes("symlinks"));
    assert.ok(note.includes(".confidentiality.json is protected"));
    assert.ok(note.includes("do not try to work around it"));
  }
});

test("bash is described as a sandboxed tool inside the launcher, and as disabled outside it", () => {
  const inside = workspaceNote("/work/a", CONF);
  assert.ok(inside.includes("runs in a sandbox where the workspace is the only writable folder"));
  assert.ok(!inside.includes("Disabled: bash"));

  const outside = workspaceNote("/work/a", { ...CONF, shell: false });
  assert.ok(outside.includes("Disabled: bash"));
  assert.ok(outside.includes("scripts/launch.sh"));
  assert.ok(!outside.includes("runs in a sandbox"));
});

test("the section says relative paths are relative to the workspace", () => {
  const note = workspaceNote("/work/a", CONF);
  assert.ok(note.includes("Relative paths are relative to the workspace folder"));
  assert.ok(note.includes('"." means the workspace itself'));
});

test("the section tells the model the workspace label, the session level and the provider's clearance", () => {
  const note = workspaceNote("/work/a", { ...CONF, taint: "confidential" });
  assert.ok(note.includes("every file and folder in the workspace is labeled confidential"));
  assert.ok(note.includes("This session is at level confidential"));
  assert.ok(note.includes("(my-openai) is cleared up to confidential"));
  assert.ok(note.includes("every tool is refused"));
  assert.ok(note.includes("cannot be used in this session"));
  assert.ok(!note.includes("no tool access"));
});

test("when the provider is cleared below the workspace, the model is told it has no tool access", () => {
  const note = workspaceNote("/work/a", NO_ACCESS);
  assert.ok(note.includes("you currently have no tool access"));
  assert.ok(note.includes("/work/a"));
  assert.ok(note.includes("labeled confidential"));
  assert.ok(note.includes("(google) is only cleared up to public"));
  assert.ok(note.includes("Do not try other tools or workarounds"));
  assert.ok(note.includes("tell the user to switch to a provider cleared for confidential"));
  assert.ok(!note.includes("You may create and modify files only inside"));
});

test("with no workspace the section still reports the session level and clearance", () => {
  const note = workspaceNote(undefined, { ...CONF, level: undefined, allowed: undefined });
  assert.ok(note.includes("this session is at level public"));
  assert.ok(!note.includes("every file and folder in the workspace is labeled"));
  assert.ok(!note.includes("no tool access"));
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
  assert.ok(!workspaceNote("/work/a", NO_ACCESS).includes("\n\n"));
  assert.ok(!workspaceNote("/work/a", { ...CONF, level: undefined, allowed: undefined }).includes("\n\n"));
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
  for (const conf of [CONF, NO_ACCESS]) {
    const once = withWorkspaceNote(BASE, "/work/a", conf);
    assert.equal(withWorkspaceNote(once, "/work/a", conf), once);
  }
});

test("text another extension appended after the workspace section is kept", () => {
  const withOther = `${withWorkspaceNote(BASE, "/work/a", CONF)}\n\n## Other\nkeep me`;
  const out = withWorkspaceNote(withOther, "/work/b", CONF);
  assert.ok(out.includes("keep me"));
  assert.ok(out.includes("/work/b"));
});
