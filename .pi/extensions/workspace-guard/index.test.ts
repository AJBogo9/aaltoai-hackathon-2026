import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import extension from "./index.ts";
import { METADATA_NAME } from "./metadata.ts";
import { BLOCKED_TOOLS, READ_ONLY_TOOLS, WRITE_TOOLS } from "./rules.ts";

type Handler = (...args: any[]) => any;
type Model = { provider: string; id: string };

const BASE_PROMPT = "You are a coding agent.\n\nTools: read, write.";
const POLICY = {
  levels: ["public", "confidential", "restricted"],
  providers: { google: "public", "my-openai": "confidential", ollama: "restricted" },
};

const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ws-guard-index-")));
const cwd = path.join(root, "project");
const home = path.join(root, "home");
const wsA = path.join(cwd, "workspace-a"); // confidential
const wsB = path.join(cwd, "workspace-b"); // public
const wsNoMeta = path.join(cwd, "workspace-none");
const policyFile = path.join(cwd, ".pi", "confidentiality.json");
const metaA = path.join(wsA, METADATA_NAME);
const reportA = path.join(wsA, "out", "report.md");

// /prompt writes a file under the home directory, so point it at the temp folder.
const realHome = process.env.HOME;
process.env.HOME = home;
after(() => {
  if (realHome === undefined) delete process.env.HOME;
  else process.env.HOME = realHome;
  fs.rmSync(root, { recursive: true, force: true });
});

function rebuild() {
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.mkdirSync(path.join(cwd, ".pi", "sub"), { recursive: true });
  fs.mkdirSync(path.join(wsA, "data"), { recursive: true });
  fs.mkdirSync(wsB);
  fs.mkdirSync(wsNoMeta);
  fs.mkdirSync(home, { recursive: true });
  fs.writeFileSync(policyFile, JSON.stringify(POLICY));
  fs.writeFileSync(path.join(wsA, "public.txt"), "hello");
  fs.writeFileSync(path.join(wsA, "data", "secret.csv"), "a,b");
  fs.writeFileSync(metaA, JSON.stringify({ level: "confidential" }));
  fs.writeFileSync(path.join(wsB, "b.txt"), "b");
  fs.writeFileSync(path.join(wsB, METADATA_NAME), JSON.stringify({ level: "public" }));
}

function setup(provider: string | undefined = "google") {
  rebuild();
  const commands = new Map<string, Handler>();
  const events = new Map<string, Handler>();
  const entries: unknown[] = [];
  const setModelCalls: Model[] = [];
  const notes: string[] = [];
  const ctx: any = {
    cwd,
    model: provider ? { provider, id: "m" } : undefined,
    ui: { notify: (message: string) => void notes.push(message) },
    getSystemPrompt: () => BASE_PROMPT,
    sessionManager: { getEntries: () => entries },
  };
  extension({
    registerCommand: (name: string, opts: { handler: Handler }) => void commands.set(name, opts.handler),
    on: (event: string, handler: Handler) => void events.set(event, handler),
    appendEntry: (customType: string, data: unknown) => void entries.push({ type: "custom", customType, data }),
    setModel: async (model: Model) => {
      setModelCalls.push(model);
      ctx.model = model;
    },
  } as never);
  return { commands, events, entries, setModelCalls, notes, ctx };
}

type Session = ReturnType<typeof setup>;

const use = (provider: string) => ({ provider, id: "m" });
const tool = (s: Session, toolName: string, input: Record<string, unknown>) =>
  s.events.get("tool_call")!({ toolName, input }, s.ctx);
const command = (s: Session, name: string, args = "") => s.commands.get(name)!(args, s.ctx);
const openWorkspace = (s: Session, folder = "workspace-a") => command(s, "workspace", folder);
const lastEntry = (s: Session) => (s.entries.at(-1) as any).data;

test("/workspace refuses a folder without a metadata file and leaves the workspace unset", async () => {
  const s = setup();
  await openWorkspace(s, "workspace-none");
  assert.ok(s.notes.at(-1)!.includes(METADATA_NAME));
  await command(s, "prompt");
  assert.ok(s.notes.at(-1)!.includes("No workspace is set"));
});

test("/workspace refuses a protected project folder", async () => {
  const s = setup();
  await openWorkspace(s, ".pi/sub");
  assert.ok(s.notes.at(-1)!.includes("inside .pi"));
});

test("/workspace sets the workspace, shows its label and saves it in the session", async () => {
  const s = setup("google");
  await openWorkspace(s);
  const out = s.notes.at(-1)!;
  assert.ok(out.includes(`Workspace set: ${wsA}`));
  assert.ok(out.includes("Workspace level: confidential"));
  assert.ok(out.includes("all file access will be refused"));
  assert.deepEqual(s.entries.at(-1), {
    type: "custom",
    customType: "confidentiality",
    data: { taint: "", workspace: wsA, created: [] },
  });
});

test("a provider cleared below the workspace label gets no file access at all", async () => {
  const s = setup("google");
  await openWorkspace(s);
  for (const name of [...READ_ONLY_TOOLS, ...WRITE_TOOLS]) {
    const r = await tool(s, name, { path: "workspace-a/public.txt" });
    assert.equal(r.block, true, name);
    assert.ok(r.reason.includes("workspace is labeled confidential"), name);
  }
});

test("a cleared provider can read, the path is rewritten, and the session level is raised and saved", async () => {
  const s = setup("my-openai");
  await openWorkspace(s);
  const input = { path: "workspace-a/data/secret.csv" };
  assert.equal(await tool(s, "read", input), undefined);
  assert.equal(input.path, path.join(wsA, "data", "secret.csv"));
  assert.equal(lastEntry(s).taint, "confidential");
});

test("ls and find do not raise the session level", async () => {
  const s = setup("my-openai");
  await openWorkspace(s);
  assert.equal(await tool(s, "ls", { path: "workspace-a" }), undefined);
  assert.equal(await tool(s, "find", { pattern: "*", path: "workspace-a" }), undefined);
  assert.equal(lastEntry(s).taint, "");
});

test("the agent can create files and then edit them, but not touch source files or the metadata file", async () => {
  const s = setup("my-openai");
  await openWorkspace(s);

  assert.equal(await tool(s, "write", { path: "workspace-a/out/report.md", content: "x" }), undefined);
  assert.deepEqual(lastEntry(s).created, [reportA]);

  fs.mkdirSync(path.join(wsA, "out"), { recursive: true });
  fs.writeFileSync(reportA, "x");
  assert.equal(await tool(s, "edit", { path: "workspace-a/out/report.md", edits: [] }), undefined);
  assert.equal(lastEntry(s).taint, "confidential");

  const source = await tool(s, "write", { path: "workspace-a/public.txt", content: "x" });
  assert.equal(source.block, true);
  assert.ok(source.reason.includes("read-only"));
  const meta = await tool(s, "write", { path: `workspace-a/${METADATA_NAME}`, content: "{}" });
  assert.equal(meta.block, true);
  assert.deepEqual(JSON.parse(fs.readFileSync(metaA, "utf8")), { level: "confidential" });
});

test("a provider cannot write into a workspace above its clearance, but can into one at its level", async () => {
  const s = setup("google");
  await openWorkspace(s, "workspace-b");
  assert.equal(await tool(s, "write", { path: "workspace-b/x.md", content: "x" }), undefined);
  assert.equal(await tool(s, "read", { path: "workspace-b/b.txt" }), undefined);

  await openWorkspace(s, "workspace-a");
  assert.equal((await tool(s, "write", { path: "workspace-a/x.md", content: "x" })).block, true);
});

test("a session that has read confidential data cannot write into a lower-labeled workspace", async () => {
  const s = setup("my-openai");
  await openWorkspace(s);
  await tool(s, "read", { path: "workspace-a/data/secret.csv" });

  await openWorkspace(s, "workspace-b");
  const write = await tool(s, "write", { path: "workspace-b/x.md", content: "x" });
  assert.equal(write.block, true);
  assert.ok(write.reason.includes("above the workspace"));
  assert.equal(await tool(s, "read", { path: "workspace-b/b.txt" }), undefined);
});

test("a message is withheld when the session is above the current provider's clearance", async () => {
  const s = setup("my-openai");
  await openWorkspace(s);
  await tool(s, "read", { path: "workspace-a/data/secret.csv" });
  const input = s.events.get("input")!;

  s.ctx.model = use("google");
  assert.deepEqual(await input({ text: "hello" }, s.ctx), { action: "handled" });
  assert.ok(s.notes.at(-1)!.includes("withheld"));

  assert.deepEqual(await input({ text: "/model" }, s.ctx), { action: "continue" });

  s.ctx.model = use("my-openai");
  assert.deepEqual(await input({ text: "hello" }, s.ctx), { action: "continue" });
});

test("messages pass while nothing has been read", async () => {
  const s = setup("google");
  await openWorkspace(s, "workspace-b");
  await tool(s, "ls", { path: "workspace-b" });
  assert.deepEqual(await s.events.get("input")!({ text: "hello" }, s.ctx), { action: "continue" });
});

test("switching to a provider that is not cleared switches back", async () => {
  const s = setup("my-openai");
  await openWorkspace(s);
  await tool(s, "read", { path: "workspace-a/data/secret.csv" });
  const select = s.events.get("model_select")!;

  await select({ model: use("google"), previousModel: use("my-openai"), source: "set" }, s.ctx);
  assert.equal(s.setModelCalls.length, 1);
  assert.equal(s.setModelCalls[0].provider, "my-openai");
  assert.ok(s.notes.at(-1)!.includes("only cleared for public"));

  await select({ model: use("ollama"), previousModel: use("my-openai"), source: "set" }, s.ctx);
  assert.equal(s.setModelCalls.length, 1);
});

test("switching provider is left alone when nothing has been read", async () => {
  const s = setup("my-openai");
  await openWorkspace(s);
  await s.events.get("model_select")!({ model: use("google"), previousModel: use("my-openai"), source: "set" }, s.ctx);
  assert.equal(s.setModelCalls.length, 0);
});

test("resuming a session restores the level, the workspace and the files the agent created", async () => {
  const s = setup("my-openai");
  fs.mkdirSync(path.join(wsA, "out"), { recursive: true });
  fs.writeFileSync(reportA, "x");
  s.entries.push({
    type: "custom",
    customType: "confidentiality",
    data: { taint: "confidential", workspace: wsA, created: [reportA] },
  });
  await s.events.get("session_start")!({ reason: "resume" }, s.ctx);

  assert.equal(await tool(s, "edit", { path: "workspace-a/out/report.md", edits: [] }), undefined);
  assert.equal((await tool(s, "write", { path: "workspace-a/public.txt", content: "x" })).block, true);

  s.ctx.model = use("google");
  assert.deepEqual(await s.events.get("input")!({ text: "hello" }, s.ctx), { action: "handled" });
});

test("a saved workspace that no longer validates is not restored", async () => {
  const s = setup("google");
  s.entries.push({
    type: "custom",
    customType: "confidentiality",
    data: { taint: "", workspace: path.join(cwd, "gone"), created: [] },
  });
  await s.events.get("session_start")!({ reason: "resume" }, s.ctx);
  assert.ok(s.notes.at(-1)!.includes("Workspace not restored"));
  await command(s, "prompt");
  assert.ok(s.notes.at(-1)!.includes("No workspace is set"));
});

test("a new session resets the level and the created files but keeps the workspace", async () => {
  const s = setup("my-openai");
  await openWorkspace(s);
  await tool(s, "write", { path: "workspace-a/out/report.md", content: "x" });
  await tool(s, "read", { path: "workspace-a/data/secret.csv" });
  fs.mkdirSync(path.join(wsA, "out"), { recursive: true });
  fs.writeFileSync(reportA, "x");

  s.entries.length = 0;
  await s.events.get("session_start")!({ reason: "new" }, s.ctx);
  s.ctx.model = use("google");
  await command(s, "prompt");
  assert.ok(s.notes.at(-1)!.includes(wsA));
  assert.ok(s.notes.at(-1)!.includes("This session is at level public"));
  assert.deepEqual(await s.events.get("input")!({ text: "hello" }, s.ctx), { action: "continue" });

  s.ctx.model = use("my-openai");
  const rewrite = await tool(s, "write", { path: "workspace-a/out/report.md", content: "x" });
  assert.equal(rewrite.block, true);
  assert.ok(rewrite.reason.includes("read-only"));
});

test("/prompt shows the whole prompt with the workspace label and the rules", async () => {
  const s = setup("google");
  await command(s, "prompt");
  assert.ok(s.notes.at(-1)!.includes(BASE_PROMPT));
  assert.ok(s.notes.at(-1)!.includes("No workspace is set"));

  await openWorkspace(s);
  await command(s, "prompt");
  const out = s.notes.at(-1)!;
  assert.ok(out.includes(BASE_PROMPT));
  assert.ok(out.includes(wsA));
  assert.ok(out.includes("labeled confidential"));
  assert.ok(out.includes("(google) is cleared up to public"));
  assert.ok(!out.includes("No workspace is set"));
  const saved = fs.readFileSync(path.join(home, ".pi", "agent", "last-system-prompt.txt"), "utf8");
  assert.ok(saved.includes(wsA));
});

test("/prompt matches the prompt the extension sends on a real turn", async () => {
  const s = setup("google");
  await openWorkspace(s);
  const turn = await s.events.get("before_agent_start")!({ systemPrompt: BASE_PROMPT }, s.ctx);
  await command(s, "prompt");
  assert.ok(turn.systemPrompt.includes(wsA));
  assert.ok(s.notes.at(-1)!.includes(turn.systemPrompt));
});

test("/confidentiality reports the label, the clearance and the session level", async () => {
  const s = setup("google");
  await command(s, "confidentiality");
  assert.ok(s.notes.at(-1)!.includes("No workspace set"));
  assert.ok(s.notes.at(-1)!.includes("cleared for public"));

  await openWorkspace(s);
  await command(s, "confidentiality");
  assert.ok(s.notes.at(-1)!.includes(`Workspace: ${wsA}`));
  assert.ok(s.notes.at(-1)!.includes("Workspace level: confidential"));
});

test("a missing provider only gets into a public workspace", async () => {
  const s = setup(undefined);
  await openWorkspace(s, "workspace-b");
  assert.equal(await tool(s, "read", { path: "workspace-b/b.txt" }), undefined);
  await openWorkspace(s);
  assert.equal((await tool(s, "read", { path: "workspace-a/public.txt" })).block, true);
});

test("without a workspace every file tool is blocked", async () => {
  const s = setup("ollama");
  for (const name of [...READ_ONLY_TOOLS, ...WRITE_TOOLS]) {
    const r = await tool(s, name, { path: "workspace-a/public.txt" });
    assert.equal(r.block, true, name);
    assert.ok(r.reason.includes("No workspace is set"));
  }
});

test("if the policy disappears, file access is blocked", async () => {
  const s = setup("ollama");
  await openWorkspace(s);
  fs.rmSync(policyFile);
  const r = await tool(s, "read", { path: "workspace-a/public.txt" });
  assert.equal(r.block, true);
  assert.ok(r.reason.includes("confidentiality.json"));
});

test("if the metadata file is corrupted, reads and writes are blocked", async () => {
  const s = setup("ollama");
  await openWorkspace(s);
  fs.writeFileSync(metaA, "{");
  const read = await tool(s, "read", { path: "workspace-a/public.txt" });
  assert.equal(read.block, true);
  assert.ok(read.reason.includes("not valid JSON"));
  assert.equal((await tool(s, "write", { path: "workspace-a/x.md", content: "x" })).block, true);
  assert.equal(fs.readFileSync(metaA, "utf8"), "{");
});

test("every tool the prompt names behaves as the prompt says", async () => {
  const s = setup("ollama");
  await openWorkspace(s);
  const turn = await s.events.get("before_agent_start")!({ systemPrompt: BASE_PROMPT }, s.ctx);
  assert.ok(turn.systemPrompt.includes("Rules enforced on every tool call"));

  for (const name of [...READ_ONLY_TOOLS, ...WRITE_TOOLS, ...BLOCKED_TOOLS]) {
    assert.ok(turn.systemPrompt.includes(name), `prompt should name ${name}`);
  }
  for (const name of READ_ONLY_TOOLS) {
    assert.equal(await tool(s, name, { path: "workspace-a/public.txt" }), undefined, name);
    assert.equal((await tool(s, name, { path: "/etc/hostname" })).block, true, name);
  }
  for (const name of WRITE_TOOLS) {
    assert.equal((await tool(s, name, { path: "README.md" })).block, true, name);
    assert.equal(await tool(s, name, { path: "workspace-a/out/x.txt" }), undefined, name);
  }
  for (const name of BLOCKED_TOOLS) {
    assert.equal((await tool(s, name, {})).block, true, name);
  }
  assert.equal((await tool(s, "some_other_tool", {})).block, true);
});
