import { BLOCKED_TOOLS, READ_ONLY_TOOLS, WRITE_TOOLS } from "./rules.ts";

const MARKER = "\n\n## Workspace\n";

/**
 * What the model is told about confidentiality: the workspace label (if a workspace is set), the
 * session level, the provider's clearance and whether that clearance allows access, or why the policy
 * is unusable.
 */
export type ConfInfo =
  | {
      provider: string | undefined;
      clearance: string;
      taint: string;
      level: string | undefined;
      allowed: boolean | undefined;
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
  let head: string;
  if (!workspace) {
    head = "No workspace is set, so all file access is blocked until the user runs /workspace <folder>.";
  } else if (conf && !("problem" in conf) && conf.level !== undefined && conf.allowed === false) {
    head = `The workspace is ${workspace}, but you currently have no file access to it: it is labeled ${conf.level} and the current provider (${conf.provider ?? "none"}) is only cleared up to ${conf.clearance}. Every file tool will be refused. Do not try other tools or workarounds; tell the user to switch to a provider cleared for ${conf.level}.`;
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
    "- You cannot write to the workspace folder itself, only to files inside it.",
    "- Existing files are read-only source data. You may create new files and change files you created in this session.",
    "- .confidentiality.json is protected and cannot be changed.",
    `- Disabled: ${list(BLOCKED_TOOLS)}, and any tool not listed above.`,
  ];
  if (conf) {
    if ("problem" in conf) {
      lines.push(
        `- The confidentiality policy could not be used (${oneLine(conf.problem)}), so all reads and writes are blocked.`,
      );
    } else {
      const provider = `The current provider (${conf.provider ?? "none"}) is cleared up to ${conf.clearance}.`;
      if (conf.level) {
        lines.push(
          `- Confidentiality: every file and folder in the workspace is labeled ${conf.level}. This session is at level ${conf.taint}. ${provider}`,
          "- If the provider is cleared below the workspace label, every file tool is refused. Reading or listing files raises the session level to the workspace label.",
          "- You may write only if the provider is cleared for the workspace label and the session level is not above it, so data never moves to a lower label.",
        );
      } else {
        lines.push(`- Confidentiality: this session is at level ${conf.taint}. ${provider}`);
      }
    }
  }
  lines.push(
    "- If a call is blocked, do not try to work around it. Tell the user, or ask them to run /workspace <folder> if a different folder is needed.",
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
