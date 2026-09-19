import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { isSandboxed, loadConfig } from "./config.ts";
import { decideRead, decideShell, decideWrite } from "./gate.ts";
import type { Env } from "./gate.ts";
import { clearanceOf, cleared } from "./policy.ts";
import type { Loaded } from "./policy.ts";
import { withWorkspaceNote } from "./prompt.ts";
import type { ConfInfo } from "./prompt.ts";
import { READ_ONLY_TOOLS, SHELL_TOOLS, WRITE_TOOLS } from "./rules.ts";
import { statusLine } from "./status.ts";
import { describeProviders, describeWorkspace } from "./workspace.ts";

type Ctx = { cwd: string; model?: { provider?: string } };
type UiCtx = Ctx & {
  ui: {
    notify(message: string, level?: string): void;
    setStatus(key: string, text: string): void;
  };
};

const STATUS_KEY = "confidentiality";

/**
 * The workspace is chosen when pi is launched (scripts/launch.sh) and cannot change afterwards; see config.ts.
 * The agent can only read and write inside it, so the whole session is at the workspace label from the first
 * message. A provider cleared below that label gets no tools and no messages. Nothing changes during a
 * session, so nothing is saved in it.
 */
export default function (pi: ExtensionAPI) {
  /**
   * Outside the launcher's container bash cannot be confined, so take it out of the model's tool list and
   * do not let it try. The block in tool_call stays as a backstop.
   */
  function hideShell(): void {
    if (isSandboxed()) return;
    try {
      const active = pi.getActiveTools();
      const kept = active.filter((name) => !SHELL_TOOLS.has(name));
      if (kept.length !== active.length) pi.setActiveTools(kept);
    } catch {
      // the block in tool_call still applies
    }
  }

  /** Redraw the footer status. It is cosmetic, so it must never break the caller. */
  function refresh(ctx: UiCtx, provider: string | undefined = ctx.model?.provider): void {
    try {
      const color = !process.env.NO_COLOR;
      const config = loadConfig();
      const text = config.ok
        ? statusLine(
            {
              policy: config.value.policy,
              workspace: config.value.workspace,
              level: config.value.meta.level,
              provider,
              taint: config.value.meta.level,
            },
            color,
          )
        : statusLine({ problem: config.reason }, color);
      ctx.ui.setStatus(STATUS_KEY, text);
    } catch {
      // ignore
    }
  }

  function loadEnv(ctx: Ctx): Loaded<Env> {
    const config = loadConfig();
    if (!config.ok) return { ok: false, reason: `${config.reason} Every tool is blocked until it is fixed.` };
    const { policy, workspace, meta, sandboxed } = config.value;
    return { ok: true, value: { policy, workspace, meta, sandboxed, provider: ctx.model?.provider } };
  }

  function confInfo(ctx: Ctx): { workspace: string | undefined; conf: ConfInfo } {
    const config = loadConfig();
    if (!config.ok) return { workspace: undefined, conf: { problem: config.reason } };
    const { policy, workspace, meta, sandboxed } = config.value;
    const provider = ctx.model?.provider;
    const clearance = clearanceOf(policy, provider);
    return {
      workspace,
      conf: {
        provider,
        clearance,
        taint: meta.level,
        level: meta.level,
        allowed: cleared(policy, clearance, meta.level),
        shell: sandboxed,
      },
    };
  }

  pi.registerCommand("confidentiality", {
    description: "Show the workspace label, the provider's clearance and the session's level",
    handler: async (_args, ctx) => {
      refresh(ctx);
      const config = loadConfig();
      if (!config.ok) {
        ctx.ui.notify(config.reason, "error");
        return;
      }
      const { policy, workspace, meta } = config.value;
      const lines = describeWorkspace(policy, meta, ctx.model?.provider, meta.level);
      ctx.ui.notify([`Workspace: ${workspace}`, ...lines].join("\n"), "info");
    },
  });

  pi.registerCommand("providers", {
    description: "List every provider's clearance and whether it may use this workspace",
    handler: async (_args, ctx) => {
      const config = loadConfig();
      if (!config.ok) {
        ctx.ui.notify(config.reason, "error");
        return;
      }
      const { policy, meta } = config.value;
      const color = !process.env.NO_COLOR;
      ctx.ui.notify(describeProviders(policy, meta.level, ctx.model?.provider, color).join("\n"), "info");
    },
  });

  pi.registerCommand("prompt", {
    description: "Print the system prompt as it will be sent on the next message",
    handler: async (_args, ctx) => {
      const { workspace, conf } = confInfo(ctx);
      const prompt = withWorkspaceNote(ctx.getSystemPrompt(), workspace, conf);
      const file = path.join(os.homedir(), ".pi", "agent", "last-system-prompt.txt");
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, prompt);
      ctx.ui.notify(`System prompt (${prompt.length} chars, also saved to ${file}):\n\n${prompt}`, "info");
    },
  });

  // A system prompt change lasts one turn, so re-append the workspace section on every prompt.
  pi.on("before_agent_start", async (event, ctx) => {
    hideShell();
    refresh(ctx);
    const { workspace, conf } = confInfo(ctx);
    return { systemPrompt: withWorkspaceNote(event.systemPrompt, workspace, conf) };
  });

  pi.on("session_start", async (_event, ctx) => {
    const config = loadConfig();
    if (!config.ok) ctx.ui.notify(`${config.reason} Every tool is blocked.`, "error");
    hideShell();
    refresh(ctx);
  });

  // The session is at the workspace label, so withhold every message while the current provider is not cleared
  // for it. Slash commands always pass, so the user can switch provider with /model.
  pi.on("input", async (event, ctx) => {
    const text = (event as { text?: unknown }).text;
    if (typeof text === "string" && text.trimStart().startsWith("/")) return { action: "continue" as const };

    const config = loadConfig();
    if (!config.ok) {
      ctx.ui.notify(`Message withheld: ${config.reason}`, "error");
      return { action: "handled" as const };
    }
    const { policy, meta } = config.value;
    const provider = ctx.model?.provider;
    const clearance = clearanceOf(policy, provider);
    if (cleared(policy, clearance, meta.level)) return { action: "continue" as const };
    ctx.ui.notify(
      `Message withheld: this session is at level ${meta.level}, but provider ${provider ?? "(none)"} is only cleared for ${clearance}. Switch to a provider cleared for ${meta.level} with /model.`,
      "error",
    );
    return { action: "handled" as const };
  });

  // Pi does not let an extension veto a model switch. Nothing needs undoing: an uncleared provider gets neither
  // messages nor tools. Just say so.
  pi.on("model_select", async (event, ctx) => {
    refresh(ctx, event.model.provider);
    const config = loadConfig();
    if (!config.ok) return;
    const { policy, meta } = config.value;
    const clearance = clearanceOf(policy, event.model.provider);
    if (cleared(policy, clearance, meta.level)) return;
    ctx.ui.notify(
      `Provider ${event.model.provider} is only cleared for ${clearance}, but this session is at ${meta.level}. It gets no tools and no messages.`,
      "warning",
    );
  });

  pi.on("tool_call", async (event, ctx) => {
    const name = event.toolName;
    const isRead = READ_ONLY_TOOLS.has(name);
    const isWrite = WRITE_TOOLS.has(name);
    const isShell = SHELL_TOOLS.has(name);
    if (!isRead && !isWrite && !isShell) {
      return { block: true, reason: `The ${name} tool is not allowed by workspace-guard.` };
    }

    const loaded = loadEnv(ctx);
    if (!loaded.ok) return { block: true, reason: loaded.reason };
    const env = loaded.value;
    const input = event.input as { path?: unknown };

    if (isShell) {
      const decision = decideShell(env);
      if (!decision.ok) return { block: true, reason: decision.reason };
    } else if (isRead) {
      const decision = decideRead(env, name, input.path);
      if (!decision.ok) return { block: true, reason: decision.reason };
      // Run the tool on exactly the path that was checked.
      input.path = decision.resolved;
    } else {
      const decision = decideWrite(env, name, input.path);
      if (!decision.ok) return { block: true, reason: `${decision.reason} Writes are limited to ${env.workspace}.` };
      input.path = decision.resolved;
    }
    return;
  });
}
