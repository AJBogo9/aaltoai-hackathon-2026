import { BLOCKED_TOOLS, READ_ONLY_TOOLS, WRITE_TOOLS } from "./rules.ts";

const MARKER = "\n\n## Workspace\n";

function list(tools: Iterable<string>): string {
  return [...tools].join(", ");
}

/** The workspace section. It must not contain a blank line, or withWorkspaceNote cannot replace it. */
export function workspaceNote(workspace: string | undefined): string {
  const head = workspace
    ? `You may create and modify files only inside this folder: ${workspace}`
    : "No workspace is set, so write and edit are blocked until the user runs /workspace <folder>.";
  return [
    head,
    "Rules enforced on every tool call:",
    `- Read-only tools (${list(READ_ONLY_TOOLS)}) may read anywhere.`,
    `- File-changing tools (${list(WRITE_TOOLS)}) work only inside the workspace.`,
    '- write and edit paths are resolved to real paths first: "..", "~" and symlinks are followed, so a path that ends up outside the workspace is rejected.',
    "- You cannot write to the workspace folder itself, only to files inside it.",
    "- Use absolute paths or paths relative to the working directory.",
    `- Disabled: ${list(BLOCKED_TOOLS)}, and any tool not listed above.`,
    "- If a call is blocked, do not try to work around it. Tell the user, or ask them to run /workspace <folder> if a different folder is needed.",
  ].join("\n");
}

/**
 * Append the workspace section to a system prompt. Idempotent: a workspace section
 * added earlier is replaced, unless other text follows it, in which case that text is kept.
 */
export function withWorkspaceNote(base: string, workspace: string | undefined): string {
  const i = base.lastIndexOf(MARKER);
  const rest = i >= 0 ? base.slice(i + MARKER.length) : "";
  const clean = i >= 0 && !rest.includes("\n\n") ? base.slice(0, i) : base;
  return `${clean}${MARKER}${workspaceNote(workspace)}`;
}
