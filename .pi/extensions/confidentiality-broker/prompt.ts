import { READ_ONLY_TOOLS, SHELL_TOOLS, WRITE_TOOLS } from "./rules.ts";

const MARKER = "\n\n## Workspace\n";

/**
 * What the model is told about confidentiality: the workspace label (if a workspace is set), the
 * session level, the provider's clearance, whether that clearance allows access, whether bash is
 * available, or why the policy is unusable.
 */
export type ConfInfo =
  | {
      provider: string | undefined;
      clearance: string;
      taint: string;
      level: string | undefined;
      allowed: boolean | undefined;
      /** bash is available: pi runs in the launcher's container. */
      shell: boolean;
    }
  | { problem: string };

function list(tools: Iterable<string>): string {
  return [...tools].join(", ");
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** The workspace section. It must not contain a blank line, or withWorkspaceNote cannot replace it. */
export function workspaceNote(workspace: string | undefined, conf?: ConfInfo): string {
  const shell = conf !== undefined && !("problem" in conf) && conf.shell;

  let head: string;
  if (!workspace) {
    head = "No workspace is set, so all tool access is blocked. The user must start pi with scripts/launch.sh <folder>.";
  } else if (conf && !("problem" in conf) && conf.level !== undefined && conf.allowed === false) {
    head = `The workspace is ${workspace}, but you currently have no tool access to it: it is labeled ${conf.level} and the current provider (${conf.provider ?? "none"}) is only cleared up to ${conf.clearance}. Every tool will be refused. Do not try other tools or workarounds; tell the user to switch to a provider cleared for ${conf.level}.`;
  } else {
    head = `You may create and modify files only inside this folder: ${workspace}`;
  }

  const lines = [
    head,
    "Rules enforced on every tool call:",
    `- Read-only tools (${list(READ_ONLY_TOOLS)}) work only inside the workspace. If you omit the path for ls, find or grep, the workspace folder is used.`,
    `- File-changing tools (${list(WRITE_TOOLS)}) work only inside the workspace.`,
    '- Relative paths are relative to the workspace folder, so "." means the workspace itself.',
    '- Paths are resolved to real paths first: "..", "~" and symlinks are followed, so a path that ends up outside the workspace is rejected.',
    "- You cannot write to the workspace folder itself with the file tools, only to files inside it.",
    "- .confidentiality.json is protected and cannot be changed.",
    shell
      ? `- The shell tool (${list(SHELL_TOOLS)}) runs in a sandbox where the workspace is the only writable folder. Commands can see everything in the workspace, so it is refused for a provider below the workspace label too.`
      : `- Disabled: ${list(SHELL_TOOLS)} (only available when pi is started with scripts/launch.sh), and any tool not listed above.`,
  ];
  if (conf) {
    if ("problem" in conf) {
      lines.push(
        `- The confidentiality setup could not be used (${oneLine(conf.problem)}), so every tool is blocked.`,
      );
    } else {
      const provider = `The current provider (${conf.provider ?? "none"}) is cleared up to ${conf.clearance}.`;
      if (conf.level) {
        lines.push(
          `- Confidentiality: every file and folder in the workspace is labeled ${conf.level}. This session is at level ${conf.taint}. ${provider}`,
          "- If the provider is cleared below the workspace label, every tool is refused and messages are withheld. The session is at the workspace label from the start, so a provider cleared below it cannot be used in this session.",
        );
      } else {
        lines.push(`- Confidentiality: this session is at level ${conf.taint}. ${provider}`);
      }
    }
  }
  lines.push(
    "- If a call is blocked, do not try to work around it. Tell the user; the workspace cannot be changed during a session.",
  );
  return lines.join("\n");
}

/**
 * Append the workspace section to a system prompt. Idempotent: a workspace section
 * added earlier is replaced, unless other text follows it, in which case that text is kept.
 */
export function withWorkspaceNote(base: string, workspace: string | undefined, conf?: ConfInfo): string {
  const i = base.lastIndexOf(MARKER);
  const rest = i >= 0 ? base.slice(i + MARKER.length) : "";
  const clean = i >= 0 && !rest.includes("\n\n") ? base.slice(0, i) : base;
  return `${clean}${MARKER}${workspaceNote(workspace, conf)}`;
}
