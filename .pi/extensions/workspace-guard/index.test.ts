import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import extension from "./index.ts";
import { BLOCKED_TOOLS, READ_ONLY_TOOLS, WRITE_TOOLS } from "./rules.ts";

type Handler = (...args: any[]) => any;

const BASE_PROMPT = "You are a coding agent.\n\nTools: read, write.";

const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ws-guard-index-")));
const cwd = path.join(root, "project");
const home = path.join(root, "home");
const wsA = path.join(cwd, "workspace-a");
const wsB = path.join(cwd, "workspace-b");
fs.mkdirSync(wsA, { recursive: true });
fs.mkdirSync(wsB);
fs.mkdirSync(home);

// /prompt writes a file under the home directory, so point it at the temp folder.
const realHome = process.env.HOME;
process.env.HOME = home;
after(() => {
  if (realHome === undefined) delete process.env.HOME;
  else process.env.HOME = realHome;
  fs.rmSync(root, { recursive: true, force: true });
});

function setup() {
  const commands = new Map<string, Handler>();
  const events = new Map<string, Handler>();
  extension({
    registerCommand: (name: string, opts: { handler: Handler }) => void commands.set(name, opts.handler),
    on: (event: string, handler: Handler) => void events.set(event, handler),
  } as never);
  const notes: string[] = [];
  const ctx = {
    cwd,
    ui: { notify: (message: string) => void notes.push(message) },
    getSystemPrompt: () => BASE_PROMPT,
  };
  return { commands, events, notes, ctx };
}

test("/prompt prints the whole prompt, with no workspace before one is set", async () => {
  const { commands, notes, ctx } = setup();
  await commands.get("prompt")!("", ctx);
  const out = notes.at(-1)!;
  assert.ok(out.includes(BASE_PROMPT));
  assert.ok(out.includes("No workspace is set"));
});

test("/prompt shows the workspace right after /workspace, before any turn", async () => {
  const { commands, notes, ctx } = setup();
  await commands.get("workspace")!("workspace-a", ctx);
  await commands.get("prompt")!("", ctx);
  const out = notes.at(-1)!;
  assert.ok(out.includes(BASE_PROMPT));
  assert.ok(out.includes(wsA));
  assert.ok(!out.includes("No workspace is set"));
});

test("/prompt follows a change of workspace", async () => {
  const { commands, notes, ctx } = setup();
  await commands.get("workspace")!("workspace-a", ctx);
  await commands.get("workspace")!("workspace-b", ctx);
  await commands.get("prompt")!("", ctx);
  const out = notes.at(-1)!;
  assert.ok(out.includes(wsB));
  assert.ok(!out.includes(wsA));
});

test("/prompt matches the prompt the extension sends on a real turn", async () => {
  const { commands, events, notes, ctx } = setup();
  await commands.get("workspace")!("workspace-a", ctx);
  const turn = await events.get("before_agent_start")!({ systemPrompt: BASE_PROMPT }, ctx);
  await commands.get("prompt")!("", ctx);
  assert.ok(turn.systemPrompt.includes(wsA));
  assert.ok(notes.at(-1)!.includes(turn.systemPrompt));
});

test("/prompt saves the full prompt to a file", async () => {
  const { commands, ctx } = setup();
  await commands.get("workspace")!("workspace-a", ctx);
  await commands.get("prompt")!("", ctx);
  const saved = fs.readFileSync(path.join(home, ".pi", "agent", "last-system-prompt.txt"), "utf8");
  assert.ok(saved.includes(BASE_PROMPT));
  assert.ok(saved.includes(wsA));
});

test("/workspace rejects the project folder and keeps the previous workspace", async () => {
  const { commands, notes, ctx } = setup();
  await commands.get("workspace")!("workspace-a", ctx);
  await commands.get("workspace")!(".", ctx);
  assert.ok(notes.at(-1)!.includes("must not contain"));
  await commands.get("prompt")!("", ctx);
  assert.ok(notes.at(-1)!.includes(wsA));
});

test("every tool the prompt names behaves as the prompt says", async () => {
  const { commands, events, ctx } = setup();
  const toolCall = events.get("tool_call")!;
  await commands.get("workspace")!("workspace-a", ctx);
  const turn = await events.get("before_agent_start")!({ systemPrompt: BASE_PROMPT }, ctx);
  assert.ok(turn.systemPrompt.includes("Rules enforced on every tool call"));

  for (const name of [...READ_ONLY_TOOLS, ...WRITE_TOOLS, ...BLOCKED_TOOLS]) {
    assert.ok(turn.systemPrompt.includes(name), `prompt should name ${name}`);
  }
  for (const name of READ_ONLY_TOOLS) {
    assert.equal(await toolCall({ toolName: name, input: { path: "/etc/hostname" } }, ctx), undefined);
  }
  for (const name of WRITE_TOOLS) {
    const outside = await toolCall({ toolName: name, input: { path: "README.md" } }, ctx);
    assert.equal(outside.block, true);
    const inside = await toolCall({ toolName: name, input: { path: "workspace-a/x.txt" } }, ctx);
    assert.equal(inside, undefined);
  }
  for (const name of BLOCKED_TOOLS) {
    assert.equal((await toolCall({ toolName: name, input: {} }, ctx)).block, true);
  }
  assert.equal((await toolCall({ toolName: "some_other_tool", input: {} }, ctx)).block, true);
});

test("tool_call blocks bash and allows a write inside the workspace only", async () => {
  const { commands, events, ctx } = setup();
  const toolCall = events.get("tool_call")!;
  await commands.get("workspace")!("workspace-a", ctx);

  const bash = await toolCall({ toolName: "bash", input: { command: "ls" } }, ctx);
  assert.equal(bash.block, true);

  const inside = { path: "workspace-a/x.txt", content: "hi" };
  assert.equal(await toolCall({ toolName: "write", input: inside }, ctx), undefined);
  assert.equal(inside.path, path.join(wsA, "x.txt"));

  const outside = await toolCall({ toolName: "write", input: { path: "README.md", content: "" } }, ctx);
  assert.equal(outside.block, true);
});
