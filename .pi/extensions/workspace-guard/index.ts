import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { findWorkspaces, pickerLabel } from "./discover.ts";
import { decideRead, decideWrite } from "./gate.ts";
import type { Env } from "./gate.ts";
import { METADATA_NAME, loadMetadata } from "./metadata.ts";
import { clearanceOf, cleared, findPolicyFile, loadPolicy, normalizeLevel, rank } from "./policy.ts";
import type { Loaded, Policy } from "./policy.ts";
import { withWorkspaceNote } from "./prompt.ts";
import type { ConfInfo } from "./prompt.ts";
import { BLOCKED_TOOLS, READ_ONLY_TOOLS, WRITE_TOOLS } from "./rules.ts";
import { statusLine } from "./status.ts";
import { activateWorkspace, describeWorkspace } from "./workspace.ts";

type Ctx = { cwd: string; model?: { provider?: string } };
type UiCtx = Ctx & {
  ui: {
    notify(message: string, level?: string): void;
    setStatus(key: string, text: string): void;
  };
};

const ENTRY = "confidentiality";
const STATUS_KEY = "confidentiality";

export default function (pi: ExtensionAPI) {
  // The workspace, the session's confidentiality level and the files the agent created. All three are
  // saved in the session (appendEntry) and restored on start, resume and /reload.
  // An empty taint means nothing has been read yet.
  let workspace: string | undefined;
  let taint = "";
  let created = new Set<string>();

  function persist(): void {
    pi.appendEntry(ENTRY, { taint, workspace, created: [...created] });
  }

  /**
   * Take the blocked tools (bash) out of the model's tool list, so it does not try them. The block in
   * tool_call stays as a backstop.
   */
  function hideBlockedTools(): void {
    try {
      const active = pi.getActiveTools();
      const kept = active.filter((name) => !BLOCKED_TOOLS.has(name));
      if (kept.length !== active.length) pi.setActiveTools(kept);
    } catch {
      // the block in tool_call still applies
    }
  }

  function loadPolicyFor(ctx: Ctx): Loaded<Policy> {
    const file = findPolicyFile(ctx.cwd);
    if (!file) return { ok: false, reason: "No .pi/confidentiality.json found." };
    return loadPolicy(file);
  }

  function currentTaint(policy: Policy): string {
    return normalizeLevel(policy, taint);
  }

  /** Raise the session level. Returns true when it changed. */
  function raise(policy: Policy, level: string): boolean {
    if (rank(policy, level) <= rank(policy, currentTaint(policy))) return false;
    taint = level;
    persist();
    return true;
  }

  /** Redraw the footer status. It is cosmetic, so it must never break the caller. */
  function refresh(ctx: UiCtx, provider: string | undefined = ctx.model?.provider): void {
    try {
      const color = !process.env.NO_COLOR;
      const policy = loadPolicyFor(ctx);
      let text: string;
      if (!policy.ok) {
        text = statusLine({ problem: policy.reason }, color);
      } else {
        let level: string | undefined;
        let problem: string | undefined;
        if (workspace) {
          const meta = loadMetadata(workspace, policy.value);
          if (meta.ok) level = meta.value.level;
          else problem = meta.reason;
        }
        text =
          problem !== undefined
            ? statusLine({ problem }, color)
            : statusLine(
                { policy: policy.value, workspace, level, provider, taint: currentTaint(policy.value) },
                color,
              );
      }
      ctx.ui.setStatus(STATUS_KEY, text);
    } catch {
      // ignore
    }
  }

  function loadEnv(ctx: Ctx): Loaded<Env> {
    if (!workspace) {
      return {
        ok: false,
        reason: "No workspace is set, so file access is blocked. Ask the user to run /workspace <folder>.",
      };
    }
    const policy = loadPolicyFor(ctx);
    if (!policy.ok) return { ok: false, reason: `${policy.reason} All file access is blocked until it is fixed.` };
    const meta = loadMetadata(workspace, policy.value);
    if (!meta.ok) return { ok: false, reason: `${meta.reason} All file access is blocked until it is fixed.` };
    return {
      ok: true,
      value: {
        policy: policy.value,
        meta: meta.value,
        workspace,
        provider: ctx.model?.provider,
        taint: currentTaint(policy.value),
        created,
      },
    };
  }

  function confInfo(ctx: Ctx): ConfInfo {
    const policy = loadPolicyFor(ctx);
    if (!policy.ok) return { problem: policy.reason };
    let level: string | undefined;
    if (workspace) {
      const meta = loadMetadata(workspace, policy.value);
      if (!meta.ok) return { problem: meta.reason };
      level = meta.value.level;
    }
    const provider = ctx.model?.provider;
    const clearance = clearanceOf(policy.value, provider);
    return {
      provider,
      clearance,
      taint: currentTaint(policy.value),
      level,
      allowed: level === undefined ? undefined : cleared(policy.value, clearance, level),
    };
  }

  async function setWorkspace(ctx: UiCtx, arg: string): Promise<void> {
    const result = activateWorkspace(arg, ctx.cwd);
    if (!result.ok) {
      ctx.ui.notify(result.reason, "error");
      return;
    }
    const { policy, meta } = result.value;
    workspace = result.value.workspace;
    persist();
    const lines = describeWorkspace(policy, meta, ctx.model?.provider, taint);
    ctx.ui.notify([`Workspace set: ${workspace}`, ...lines].join("\n"), "info");
    refresh(ctx);
  }

  pi.registerCommand("workspace", {
    description: "Set the folder the agent may read and write: /workspace <folder>, or pick one from a list",
    handler: async (args, ctx) => {
      if (args.trim()) {
        await setWorkspace(ctx, args);
        return;
      }
      if (!ctx.hasUI) {
        ctx.ui.notify(workspace ? `Workspace: ${workspace}` : "No workspace set. Use /workspace <folder>.", "info");
        return;
      }
      const policy = loadPolicyFor(ctx);
      if (!policy.ok) {
        ctx.ui.notify(policy.reason, "error");
        return;
      }
      const found = findWorkspaces(ctx.cwd, policy.value);
      if (found.length === 0) {
        ctx.ui.notify(
          `No workspace folders found under ${ctx.cwd}. Create <folder>/${METADATA_NAME}, for example {"level": "confidential"}, or run /workspace <folder>.`,
          "info",
        );
        return;
      }
      const clearance = clearanceOf(policy.value, ctx.model?.provider);
      const folders = new Map<string, string>();
      for (const candidate of found) {
        const label = pickerLabel(
          candidate,
          cleared(policy.value, clearance, candidate.level),
          candidate.abs === workspace,
        );
        folders.set(label, candidate.abs);
      }
      const choice = await ctx.ui.select("Choose a workspace", [...folders.keys()]);
      const abs = choice === undefined ? undefined : folders.get(choice);
      if (abs) await setWorkspace(ctx, abs);
    },
  });

  pi.registerCommand("confidentiality", {
    description: "Show the workspace label, the provider's clearance and the session's level",
    handler: async (_args, ctx) => {
      refresh(ctx);
      const policy = loadPolicyFor(ctx);
      if (!policy.ok) {
        ctx.ui.notify(policy.reason, "error");
        return;
      }
      if (!workspace) {
        const provider = ctx.model?.provider;
        ctx.ui.notify(
          [
            "No workspace set. Use /workspace <folder>.",
            `Provider ${provider ?? "(none)"} is cleared for ${clearanceOf(policy.value, provider)}.`,
            `Session level: ${currentTaint(policy.value)}.`,
          ].join("\n"),
          "info",
        );
        return;
      }
      const meta = loadMetadata(workspace, policy.value);
      if (!meta.ok) {
        ctx.ui.notify(meta.reason, "error");
        return;
      }
      const lines = describeWorkspace(policy.value, meta.value, ctx.model?.provider, taint);
      ctx.ui.notify([`Workspace: ${workspace}`, ...lines].join("\n"), "info");
    },
  });

  pi.registerCommand("prompt", {
    description: "Print the system prompt as it will be sent on the next message",
    handler: async (_args, ctx) => {
      const prompt = withWorkspaceNote(ctx.getSystemPrompt(), workspace, confInfo(ctx));
      const file = path.join(os.homedir(), ".pi", "agent", "last-system-prompt.txt");
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, prompt);
      ctx.ui.notify(`System prompt (${prompt.length} chars, also saved to ${file}):\n\n${prompt}`, "info");
    },
  });

  // A system prompt change lasts one turn, so re-append the workspace section on every prompt.
  pi.on("before_agent_start", async (event, ctx) => {
    hideBlockedTools();
    refresh(ctx);
    return { systemPrompt: withWorkspaceNote(event.systemPrompt, workspace, confInfo(ctx)) };
  });

  pi.on("session_start", async (event, ctx) => {
    let saved: { taint?: unknown; workspace?: unknown; created?: unknown } | undefined;
    for (const entry of ctx.sessionManager.getEntries()) {
      const e = entry as { type?: string; customType?: string; data?: unknown };
      if (e.type === "custom" && e.customType === ENTRY && typeof e.data === "object" && e.data !== null) {
        saved = e.data as { taint?: unknown; workspace?: unknown; created?: unknown };
      }
    }

    const isNew = (event as { reason?: string }).reason === "new";
    taint = typeof saved?.taint === "string" ? saved.taint : "";
    created = new Set(
      Array.isArray(saved?.created) ? saved.created.filter((p): p is string => typeof p === "string") : [],
    );
    const keep = isNew ? workspace : undefined;
    workspace = undefined;

    const wanted = typeof saved?.workspace === "string" ? saved.workspace : keep;
    if (wanted) {
      const result = activateWorkspace(wanted, ctx.cwd);
      if (result.ok) {
        workspace = result.value.workspace;
        if (isNew) persist();
      } else {
        ctx.ui.notify(`Workspace not restored: ${result.reason}`, "warning");
      }
    }
    hideBlockedTools();
    refresh(ctx);
  });

  // Withhold a message if the session already holds data the current provider may not see,
  // for example after switching to a less trusted provider. Slash commands always pass.
  pi.on("input", async (event, ctx) => {
    const text = (event as { text?: unknown }).text;
    if (typeof text === "string" && text.trimStart().startsWith("/")) return { action: "continue" as const };
    if (!taint) return { action: "continue" as const };

    const policy = loadPolicyFor(ctx);
    if (!policy.ok) {
      ctx.ui.notify(`Message withheld: ${policy.reason}`, "error");
      return { action: "handled" as const };
    }
    const provider = ctx.model?.provider;
    const clearance = clearanceOf(policy.value, provider);
    const level = currentTaint(policy.value);
    if (cleared(policy.value, clearance, level)) return { action: "continue" as const };
    ctx.ui.notify(
      `Message withheld: this session is at level ${level}, but provider ${provider ?? "(none)"} is only cleared for ${clearance}. Switch back to a cleared provider, or start a new session with /new.`,
      "error",
    );
    return { action: "handled" as const };
  });

  // model_select cannot veto a switch, so switch back if the new provider is not cleared for the session.
  pi.on("model_select", async (event, ctx) => {
    refresh(ctx, event.model.provider);
    if (!taint) return;
    const policy = loadPolicyFor(ctx);
    if (!policy.ok) return;
    const clearance = clearanceOf(policy.value, event.model.provider);
    const level = currentTaint(policy.value);
    if (cleared(policy.value, clearance, level)) return;
    const previous = event.previousModel;
    ctx.ui.notify(
      `Provider ${event.model.provider} is only cleared for ${clearance}, but this session is at ${level}.${previous ? ` Switching back to ${previous.provider}.` : ""}`,
      "warning",
    );
    if (previous) {
      try {
        await pi.setModel(previous);
      } catch (err) {
        ctx.ui.notify(`Could not switch back: ${(err as Error).message}`, "error");
      }
    }
  });

  pi.on("tool_call", async (event, ctx) => {
    const name = event.toolName;

    if (BLOCKED_TOOLS.has(name)) {
      return {
        block: true,
        reason: `The ${name} tool is disabled. Use ${[...READ_ONLY_TOOLS, ...WRITE_TOOLS].join(", ")} instead.`,
      };
    }
    const isRead = READ_ONLY_TOOLS.has(name);
    const isWrite = WRITE_TOOLS.has(name);
    if (!isRead && !isWrite) {
      return { block: true, reason: `The ${name} tool is not allowed by workspace-guard.` };
    }

    const loaded = loadEnv(ctx);
    if (!loaded.ok) return { block: true, reason: loaded.reason };
    const env = loaded.value;
    const input = event.input as { path?: unknown };

    if (isRead) {
      const decision = decideRead(env, name, input.path);
      if (!decision.ok) return { block: true, reason: decision.reason };
      // Run the tool on exactly the path that was checked.
      input.path = decision.resolved;
      if (raise(env.policy, decision.level)) refresh(ctx);
      return;
    }

    const decision = decideWrite(env, name, input.path);
    if (!decision.ok) return { block: true, reason: `${decision.reason} Writes are limited to ${env.workspace}.` };
    input.path = decision.resolved;
    created.add(decision.resolved);
    persist();
    if (decision.readLevel && raise(env.policy, decision.readLevel)) refresh(ctx);
    return;
  });
}
