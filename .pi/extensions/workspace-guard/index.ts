import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { checkWritePath, resolveWorkspace } from "./paths.ts";
import { withWorkspaceNote } from "./prompt.ts";
import { BLOCKED_TOOLS, READ_ONLY_TOOLS, WRITE_TOOLS } from "./rules.ts";

export default function (pi: ExtensionAPI) {
  // Kept in memory only: it resets on restart or /reload, and writes stay blocked until it is set again.
  let workspace: string | undefined;

  pi.registerCommand("workspace", {
    description: "Set the folder the agent may write to: /workspace <folder>",
    handler: async (args, ctx) => {
      if (!args.trim()) {
        ctx.ui.notify(
          workspace ? `Workspace: ${workspace}` : "No workspace set. Use /workspace <folder>.",
          "info",
        );
        return;
      }
      const result = resolveWorkspace(args, ctx.cwd);
      if (!result.ok) {
        ctx.ui.notify(result.reason, "error");
        return;
      }
      workspace = result.resolved;
      ctx.ui.notify(`Workspace set: ${workspace}`, "info");
    },
  });

  pi.registerCommand("prompt", {
    description: "Print the system prompt as it will be sent on the next message",
    handler: async (_args, ctx) => {
      const prompt = withWorkspaceNote(ctx.getSystemPrompt(), workspace);
      const file = path.join(os.homedir(), ".pi", "agent", "last-system-prompt.txt");
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, prompt);
      ctx.ui.notify(`System prompt (${prompt.length} chars, also saved to ${file}):\n\n${prompt}`, "info");
    },
  });

  // A system prompt change lasts one turn, so re-append the workspace section on every prompt.
  pi.on("before_agent_start", async (event) => {
    return { systemPrompt: withWorkspaceNote(event.systemPrompt, workspace) };
  });

  pi.on("tool_call", async (event, ctx) => {
    const name = event.toolName;

    if (READ_ONLY_TOOLS.has(name)) return;

    if (BLOCKED_TOOLS.has(name)) {
      return {
        block: true,
        reason: `The ${name} tool is disabled. Use ${[...READ_ONLY_TOOLS, ...WRITE_TOOLS].join(", ")} instead.`,
      };
    }

    if (WRITE_TOOLS.has(name)) {
      if (!workspace) {
        return {
          block: true,
          reason: "No workspace is set, so writes are blocked. Ask the user to run /workspace <folder>.",
        };
      }
      const input = event.input as { path?: unknown };
      const check = checkWritePath(workspace, input.path, ctx.cwd);
      if (!check.ok) {
        return { block: true, reason: `${check.reason} Writes are limited to ${workspace}.` };
      }
      // Run the tool on exactly the path that was checked.
      input.path = check.resolved;
      return;
    }

    return { block: true, reason: `The ${name} tool is not allowed by workspace-guard.` };
  });
}
