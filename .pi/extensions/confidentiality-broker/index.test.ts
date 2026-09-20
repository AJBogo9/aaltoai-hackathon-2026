import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import extension from "./index.ts";
import { METADATA_NAME } from "./metadata.ts";
import { READ_ONLY_TOOLS, SHELL_TOOLS, WRITE_TOOLS } from "./rules.ts";

type Handler = (...args: any[]) => any;
type Model = { provider: string; id: string };

const BASE_PROMPT = "You are a coding agent.\n\nTools: read, write.";
const POLICY = {
  levels: ["public", "confidential", "restricted"],
  providers: { google: "public", "my-openai": "confidential", ollama: "restricted" },
};

const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ws-guard-index-")));
const ws = path.join(root, "workspace");
const home = path.join(root, "home");
const policyFile = path.join(root, "policy.json");
const metaFile = path.join(ws, METADATA_NAME);

// The extension reads what scripts/launch.sh sets. /prompt writes a file under the home directory, so point it
// at the temp folder. The footer text is compared as plain text.
const VARS = ["HOME", "NO_COLOR", "PI_POLICY_FILE", "PI_WORKSPACE", "PI_WORKSPACE_LEVEL", "PI_SANDBOXED"] as const;
const saved = Object.fromEntries(VARS.map((name) => [name, process.env[name]]));
after(() => {
  for (const name of VARS) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
  fs.rmSync(root, { recursive: true, force: true });
});

function rebuild() {
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(path.join(ws, "data"), { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  fs.writeFileSync(policyFile, JSON.stringify(POLICY));
  fs.writeFileSync(path.join(ws, "public.txt"), "hello");
  fs.writeFileSync(path.join(ws, "data", "secret.csv"), "a,b");
  fs.writeFileSync(metaFile, JSON.stringify({ level: "confidential" }));
}

function setup(provider: string | undefined = "google", opts: { level?: string; sandboxed?: boolean } = {}) {
  rebuild();
  process.env.HOME = home;
  process.env.NO_COLOR = "1";
  process.env.PI_POLICY_FILE = policyFile;
  process.env.PI_WORKSPACE = ws;
  process.env.PI_WORKSPACE_LEVEL = opts.level ?? "confidential";
  if (opts.sandboxed === false) delete process.env.PI_SANDBOXED;
  else process.env.PI_SANDBOXED = "1";

  const commands = new Map<string, Handler>();
  const events = new Map<string, Handler>();
  const entries: unknown[] = [];
  const setModelCalls: Model[] = [];
  const notes: string[] = [];
  const statuses: string[] = [];
  const ctx: any = {
    cwd: ws,
    hasUI: true,
    model: provider ? { provider, id: "m" } : undefined,
    ui: {
      notify: (message: string) => void notes.push(message),
      setStatus: (_key: string, text: string) => void statuses.push(text),
    },
    getSystemPrompt: () => BASE_PROMPT,
    sessionManager: { getEntries: () => entries },
  };
  const toolState = {
    active: ["read", "bash", "edit", "write", "grep", "find", "ls", "other_ext_tool"],
    calls: 0,
    fail: false,
  };
  extension({
    registerCommand: (name: string, cmd: { handler: Handler }) => void commands.set(name, cmd.handler),
    on: (event: string, handler: Handler) => void events.set(event, handler),
    appendEntry: (customType: string, data: unknown) => void entries.push({ type: "custom", customType, data }),
    setModel: async (model: Model) => {
      setModelCalls.push(model);
      ctx.model = model;
    },
    getActiveTools: () => [...toolState.active],
    setActiveTools: (names: string[]) => {
      toolState.calls += 1;
      if (toolState.fail) throw new Error("boom");
      toolState.active = names;
    },
  } as never);
  return { commands, events, entries, setModelCalls, notes, statuses, toolState, ctx };
}

type Session = ReturnType<typeof setup>;

const use = (provider: string) => ({ provider, id: "m" });
const tool = (s: Session, toolName: string, input: Record<string, unknown>) =>
  s.events.get("tool_call")!({ toolName, input }, s.ctx);
const command = (s: Session, name: string, args = "") => s.commands.get(name)!(args, s.ctx);
const start = (s: Session, reason = "startup") => s.events.get("session_start")!({ reason }, s.ctx);
const ALL_TOOLS = [...READ_ONLY_TOOLS, ...WRITE_TOOLS, ...SHELL_TOOLS];

test("without the launcher's environment every tool is blocked and the reason says how to launch", async () => {
  for (const name of ["PI_POLICY_FILE", "PI_WORKSPACE", "PI_WORKSPACE_LEVEL"]) {
    const s = setup("ollama");
    delete process.env[name];
    for (const t of ALL_TOOLS) {
      const r = await tool(s, t, { path: "public.txt", command: "ls" });
      assert.equal(r.block, true, `${name} ${t}`);
      assert.ok(r.reason.includes("Every tool is blocked"), `${name} ${t}`);
    }
  }
  const s = setup("ollama");
  delete process.env.PI_WORKSPACE;
  assert.ok((await tool(s, "read", { path: "public.txt" })).reason.includes("scripts/launch.sh"));
});

test("a provider cleared below the workspace label gets no tools at all, bash included", async () => {
  const s = setup("google");
  for (const name of ALL_TOOLS) {
    const r = await tool(s, name, { path: "public.txt", command: "cat public.txt" });
    assert.equal(r.block, true, name);
    assert.ok(r.reason.includes("workspace is labeled confidential"), name);
  }
});

test("a cleared provider can read, and the path is rewritten to the checked absolute path", async () => {
  const s = setup("my-openai");
  const input = { path: "data/secret.csv" };
  assert.equal(await tool(s, "read", input), undefined);
  assert.equal(input.path, path.join(ws, "data", "secret.csv"));
});

test("every allowed tool works for a cleared provider", async () => {
  const calls: [string, Record<string, unknown>][] = [
    ["ls", { path: "." }],
    ["find", { pattern: "*" }],
    ["grep", { pattern: "a" }],
    ["write", { path: "out.md", content: "x" }],
    ["edit", { path: "public.txt", edits: [] }],
    ["bash", { command: "ls" }],
  ];
  const s = setup("my-openai");
  for (const [name, input] of calls) {
    assert.equal(await tool(s, name, input), undefined, name);
  }
});

test("the session is at the workspace label from the start, and nothing is saved in the session", async () => {
  const s = setup("my-openai");
  await start(s);
  assert.ok(s.statuses.at(-1)!.endsWith("session confidential"));
  await tool(s, "read", { path: "data/secret.csv" });
  assert.ok(s.statuses.at(-1)!.endsWith("session confidential"));
  assert.equal(s.entries.length, 0);
});

test("bash is refused outside the launcher's container, and allowed inside it for a cleared provider", async () => {
  const outside = setup("ollama", { sandboxed: false });
  const refused = await tool(outside, "bash", { command: "ls" });
  assert.equal(refused.block, true);
  assert.ok(refused.reason.includes("scripts/launch.sh"));

  const inside = setup("ollama");
  const input = { command: "python3 report.py" };
  assert.equal(await tool(inside, "bash", input), undefined);
  assert.deepEqual(input, { command: "python3 report.py" });
});

test("files in the workspace can be created and changed, but not the label file or anything outside", async () => {
  const s = setup("my-openai");
  assert.equal(await tool(s, "write", { path: "out/report.md", content: "x" }), undefined);
  assert.equal(await tool(s, "write", { path: "public.txt", content: "x" }), undefined);
  assert.equal(await tool(s, "edit", { path: "data/secret.csv", edits: [] }), undefined);

  const meta = await tool(s, "write", { path: METADATA_NAME, content: "{}" });
  assert.equal(meta.block, true);
  assert.ok(meta.reason.includes("protected"));
  assert.deepEqual(JSON.parse(fs.readFileSync(metaFile, "utf8")), { level: "confidential" });

  for (const p of ["../README.md", "/etc/x", ".", ""]) {
    assert.equal((await tool(s, "write", { path: p, content: "x" })).block, true, JSON.stringify(p));
  }
});

test("a provider with the lowest clearance works in a public workspace", async () => {
  const s = setup("google", { level: "public" });
  assert.equal(await tool(s, "read", { path: "public.txt" }), undefined);
  assert.equal(await tool(s, "bash", { command: "ls" }), undefined);
  assert.equal(await tool(s, "write", { path: "x.md", content: "x" }), undefined);
  assert.deepEqual(await s.events.get("input")!({ text: "hello" }, s.ctx), { action: "continue" });
});

test("a missing provider only gets into a public workspace", async () => {
  const pub = setup(undefined, { level: "public" });
  assert.equal(await tool(pub, "read", { path: "public.txt" }), undefined);
  const conf = setup(undefined);
  assert.equal((await tool(conf, "read", { path: "public.txt" })).block, true);
});

test("compaction and branch summarisation are cancelled for an uncleared provider", async () => {
  const s = setup("google");
  for (const [event, word] of [
    ["session_before_compact", "Compaction"],
    ["session_before_tree", "Branch summarisation"],
  ] as const) {
    assert.deepEqual(await s.events.get(event)!({}, s.ctx), { cancel: true }, event);
    assert.ok(s.notes.at(-1)!.startsWith(`${word} cancelled`), event);
    assert.ok(s.notes.at(-1)!.includes("confidential"), event);
  }

  // A cleared provider is left alone.
  s.ctx.model = use("my-openai");
  for (const event of ["session_before_compact", "session_before_tree"] as const) {
    assert.equal(await s.events.get(event)!({}, s.ctx), undefined, event);
  }
});

test("compaction is cancelled when the setup is unusable", async () => {
  const s = setup("ollama");
  delete process.env.PI_WORKSPACE;
  assert.deepEqual(await s.events.get("session_before_compact")!({}, s.ctx), { cancel: true });
  assert.ok(s.notes.at(-1)!.startsWith("Compaction cancelled"));
});

test("an uncleared provider gets no messages from the very first one, slash text included", async () => {
  const s = setup("google");
  const input = s.events.get("input")!;
  assert.deepEqual(await input({ text: "hello" }, s.ctx), { action: "handled" });
  assert.ok(s.notes.at(-1)!.includes("withheld"));
  assert.ok(s.notes.at(-1)!.includes("/model"));

  // Pi expands a skill or prompt-template reference AFTER this hook and sends it to the model with the whole
  // transcript, so slash text must be withheld too. Pi's own commands and the extension's commands are
  // dispatched before this hook runs and never reach it.
  assert.deepEqual(await input({ text: "/analyze" }, s.ctx), { action: "handled" });
  assert.deepEqual(await input({ text: "/skill:analyze" }, s.ctx), { action: "handled" });
  assert.deepEqual(await input({ text: "  /summarise the employee data" }, s.ctx), { action: "handled" });

  s.ctx.model = use("my-openai");
  assert.deepEqual(await input({ text: "hello" }, s.ctx), { action: "continue" });
  s.ctx.model = use("ollama");
  assert.deepEqual(await input({ text: "hello" }, s.ctx), { action: "continue" });
});

test("messages are withheld when the setup is unusable", async () => {
  const s = setup("my-openai");
  delete process.env.PI_WORKSPACE;
  assert.deepEqual(await s.events.get("input")!({ text: "hello" }, s.ctx), { action: "handled" });
  assert.ok(s.notes.at(-1)!.includes("Message withheld"));
});

test("selecting a provider that is not cleared only warns: pi is never asked to switch model", async () => {
  const s = setup("my-openai");
  const select = s.events.get("model_select")!;

  await select({ model: use("google"), previousModel: use("my-openai"), source: "set" }, s.ctx);
  assert.ok(s.notes.at(-1)!.includes("only cleared for public"));
  assert.ok(s.notes.at(-1)!.includes("no tools and no messages"));

  // two uncleared providers in a row must not bounce between each other
  await select({ model: use("some-other"), previousModel: use("google"), source: "set" }, s.ctx);
  assert.equal(s.setModelCalls.length, 0);

  const notes = s.notes.length;
  await select({ model: use("ollama"), previousModel: use("google"), source: "set" }, s.ctx);
  assert.equal(s.notes.length, notes, "no warning for a cleared provider");
});

test("resuming or starting a new session is at the workspace label too", async () => {
  for (const reason of ["resume", "new", "startup"]) {
    const s = setup("google");
    await start(s, reason);
    assert.deepEqual(await s.events.get("input")!({ text: "hello" }, s.ctx), { action: "handled" }, reason);
    assert.ok(s.statuses.at(-1)!.includes("messages withheld"), reason);
    assert.equal(s.entries.length, 0, reason);
  }
});

test("starting with an unusable setup tells the user and reports it in the footer", async () => {
  const s = setup("google");
  delete process.env.PI_WORKSPACE_LEVEL;
  await start(s);
  assert.ok(s.notes.at(-1)!.includes("Every tool is blocked"));
  assert.equal(s.statuses.at(-1), "✗ confidentiality unusable (run /confidentiality)");
});

test("/prompt shows the whole prompt with the workspace, its label and the rules", async () => {
  const s = setup("google");
  await command(s, "prompt");
  const out = s.notes.at(-1)!;
  assert.ok(out.includes(BASE_PROMPT));
  assert.ok(out.includes(ws));
  assert.ok(out.includes("labeled confidential"));
  assert.ok(out.includes("(google) is cleared up to public"));
  assert.ok(!out.includes("No workspace is set"));
  const file = fs.readFileSync(path.join(home, ".pi", "agent", "last-system-prompt.txt"), "utf8");
  assert.ok(file.includes(ws));
});

test("/prompt tells a provider without clearance that it has no tools, and one with clearance that it has bash", async () => {
  const s = setup("google");
  await command(s, "prompt");
  assert.ok(s.notes.at(-1)!.includes("you currently have no tool access"));

  s.ctx.model = use("my-openai");
  await command(s, "prompt");
  assert.ok(!s.notes.at(-1)!.includes("no tool access"));
  assert.ok(s.notes.at(-1)!.includes("You may create and modify files only inside this folder"));
  assert.ok(s.notes.at(-1)!.includes("runs in a sandbox"));
});

test("/prompt says bash is disabled outside the launcher, and blocked everything when the setup is unusable", async () => {
  const outside = setup("my-openai", { sandboxed: false });
  await command(outside, "prompt");
  assert.ok(outside.notes.at(-1)!.includes("Disabled: bash"));

  const broken = setup("my-openai");
  delete process.env.PI_WORKSPACE;
  await command(broken, "prompt");
  assert.ok(broken.notes.at(-1)!.includes("No workspace is set"));
  assert.ok(broken.notes.at(-1)!.includes("could not be used"));
});

test("/prompt matches the prompt the extension sends on a real turn", async () => {
  const s = setup("google");
  const turn = await s.events.get("before_agent_start")!({ systemPrompt: BASE_PROMPT }, s.ctx);
  await command(s, "prompt");
  assert.ok(turn.systemPrompt.includes(ws));
  assert.ok(s.notes.at(-1)!.includes(turn.systemPrompt));
});

test("/confidentiality reports the workspace, its label, the clearance and the session level", async () => {
  const s = setup("google");
  await command(s, "confidentiality");
  const out = s.notes.at(-1)!;
  assert.ok(out.includes(`Workspace: ${ws}`));
  assert.ok(out.includes("Workspace level: confidential"));
  assert.ok(out.includes("cleared for public"));
  assert.ok(out.includes("Session level: confidential"));

  delete process.env.PI_POLICY_FILE;
  await command(s, "confidentiality");
  assert.ok(s.notes.at(-1)!.includes("PI_POLICY_FILE"));
});

test("there is no /workspace command: the workspace is fixed at launch", () => {
  const s = setup("google");
  assert.equal(s.commands.has("workspace"), false);
});

test("the footer status shows the workspace, the provider's clearance and the session level", async () => {
  const s = setup("google");
  await start(s);
  assert.equal(
    s.statuses.at(-1),
    "● workspace [confidential]  ·  google [public] ✗ no access  ·  session confidential ⛔ messages withheld",
  );
});

test("the footer status follows the provider", async () => {
  const s = setup("my-openai");
  await start(s);
  assert.ok(s.statuses.at(-1)!.includes("my-openai [confidential] ✓"));
  assert.ok(s.statuses.at(-1)!.endsWith("session confidential"));

  await s.events.get("model_select")!({ model: use("google"), previousModel: undefined, source: "set" }, s.ctx);
  assert.ok(s.statuses.at(-1)!.includes("google [public] ✗ no access"));
  assert.ok(s.statuses.at(-1)!.endsWith("session confidential ⛔ messages withheld"));
});

test("a failing status update never breaks a tool call", async () => {
  const s = setup("my-openai");
  s.ctx.ui.setStatus = () => {
    throw new Error("boom");
  };
  assert.equal(await tool(s, "read", { path: "data/secret.csv" }), undefined);
});

test("outside the launcher, bash is taken out of the model's tool list, and put back only when it is safe", async () => {
  const outside = setup("google", { sandboxed: false });
  await start(outside);
  assert.deepEqual(outside.toolState.active, ["read", "edit", "write", "grep", "find", "ls", "other_ext_tool"]);

  outside.toolState.active = [...outside.toolState.active, "bash"];
  await outside.events.get("before_agent_start")!({ systemPrompt: BASE_PROMPT }, outside.ctx);
  assert.ok(!outside.toolState.active.includes("bash"));
  assert.ok(outside.toolState.active.includes("other_ext_tool"));

  const calls = outside.toolState.calls;
  await outside.events.get("before_agent_start")!({ systemPrompt: BASE_PROMPT }, outside.ctx);
  assert.equal(outside.toolState.calls, calls, "nothing to hide, so the tool list is left alone");

  const inside = setup("google");
  await start(inside);
  assert.ok(inside.toolState.active.includes("bash"));
  assert.equal(inside.toolState.calls, 0);
});

test("if the tool list cannot be changed, bash is still refused when it is called", async () => {
  const s = setup("my-openai", { sandboxed: false });
  s.toolState.fail = true;
  await start(s);
  assert.ok(s.toolState.active.includes("bash"));
  assert.equal((await tool(s, "bash", { command: "ls -F" })).block, true);
});

test("relative paths in tool calls are relative to the workspace, and the tool runs on the absolute path", async () => {
  const s = setup("my-openai");

  const dot = { path: "." };
  assert.equal(await tool(s, "ls", dot), undefined);
  assert.equal(dot.path, ws);

  const bare: Record<string, unknown> = {};
  assert.equal(await tool(s, "ls", bare), undefined);
  assert.equal(bare.path, ws);

  const read = { path: "./data/secret.csv" };
  assert.equal(await tool(s, "read", read), undefined);
  assert.equal(read.path, path.join(ws, "data", "secret.csv"));

  const write = { path: "out/new.md", content: "x" };
  assert.equal(await tool(s, "write", write), undefined);
  assert.equal(write.path, path.join(ws, "out", "new.md"));
});

test("every tool the prompt names behaves as the prompt says", async () => {
  const s = setup("ollama");
  const turn = await s.events.get("before_agent_start")!({ systemPrompt: BASE_PROMPT }, s.ctx);
  assert.ok(turn.systemPrompt.includes("Rules enforced on every tool call"));

  for (const name of ALL_TOOLS) {
    assert.ok(turn.systemPrompt.includes(name), `prompt should name ${name}`);
  }
  for (const name of READ_ONLY_TOOLS) {
    assert.equal(await tool(s, name, { path: "public.txt" }), undefined, name);
    assert.equal((await tool(s, name, { path: "/etc/hostname" })).block, true, name);
  }
  for (const name of WRITE_TOOLS) {
    assert.equal((await tool(s, name, { path: "../README.md" })).block, true, name);
    assert.equal(await tool(s, name, { path: "out/x.txt" }), undefined, name);
  }
  for (const name of SHELL_TOOLS) {
    assert.equal(await tool(s, name, { command: "ls" }), undefined, name);
  }
  assert.equal((await tool(s, "some_other_tool", {})).block, true);
});
