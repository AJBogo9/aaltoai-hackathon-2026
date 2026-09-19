import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { decideRead, decideWrite } from "./gate.ts";
import type { Env } from "./gate.ts";
import { loadMetadata } from "./metadata.ts";
import { clearanceOf, cleared, findPolicyFile, loadPolicy, normalizeLevel, rank } from "./policy.ts";
import type { Loaded, Policy } from "./policy.ts";
import { withWorkspaceNote } from "./prompt.ts";
import type { ConfInfo } from "./prompt.ts";
import { BLOCKED_TOOLS, READ_ONLY_TOOLS, WRITE_TOOLS } from "./rules.ts";
import { activateWorkspace, describeWorkspace } from "./workspace.ts";

type Ctx = { cwd: string; model?: { provider?: string } };

const ENTRY = "confidentiality";

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

  function loadPolicyFor(ctx: Ctx): Loaded<Policy> {
    const file = findPolicyFile(ctx.cwd);
    if (!file) return { ok: false, reason: "No .pi/confidentiality.json found." };
    return loadPolicy(file);
  }

  function currentTaint(policy: Policy): string {
    return normalizeLevel(policy, taint);
  }

  function raise(policy: Policy, level: string): void {
    if (rank(policy, level) > rank(policy, currentTaint(policy))) {
      taint = level;
      persist();
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
        cwd: ctx.cwd,
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
    return {
      provider,
      clearance: clearanceOf(policy.value, provider),
      taint: currentTaint(policy.value),
      level,
    };
  }

  pi.registerCommand("workspace", {
    description: "Set the folder the agent may read and write: /workspace <folder>",
    handler: async (args, ctx) => {
      if (!args.trim()) {
        ctx.ui.notify(
          workspace ? `Workspace: ${workspace}` : "No workspace set. Use /workspace <folder>.",
          "info",
        );
        return;
      }
      const result = activateWorkspace(args, ctx.cwd);
      if (!result.ok) {
        ctx.ui.notify(result.reason, "error");
        return;
      }
      const { policy, meta } = result.value;
      workspace = result.value.workspace;
      persist();
      const lines = describeWorkspace(policy, meta, ctx.model?.provider, taint);
      ctx.ui.notify([`Workspace set: ${workspace}`, ...lines].join("\n"), "info");
    },
  });

  pi.registerCommand("confidentiality", {
    description: "Show the workspace label, the provider's clearance and the session's level",
    handler: async (_args, ctx) => {
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
      raise(env.policy, decision.level);
      return;
    }

    const decision = decideWrite(env, name, input.path);
    if (!decision.ok) return { block: true, reason: `${decision.reason} Writes are limited to ${env.workspace}.` };
    input.path = decision.resolved;
    created.add(decision.resolved);
    persist();
    if (decision.readLevel) raise(env.policy, decision.readLevel);
    return;
  });
}
