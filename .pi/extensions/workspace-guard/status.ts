import * as path from "node:path";
import { clearanceOf, cleared, rank } from "./policy.ts";
import type { Policy } from "./policy.ts";

/** What the footer needs. `problem` means the policy or the workspace metadata is unusable. */
export type StatusInput = {
  problem?: string;
  policy?: Policy;
  workspace?: string;
  /** The workspace label. */
  level?: string;
  provider?: string;
  /** The session level. */
  taint?: string;
};

type Color = "green" | "yellow" | "red" | "dim";

const CODES: Record<Color, string> = {
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
};
const RESET = "\x1b[0m";

function paint(text: string, color: Color, on: boolean): string {
  return on ? `${CODES[color]}${text}${RESET}` : text;
}

export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

/** Lowest level green, highest red, the ones between yellow. An unknown level is red. */
export function levelColor(policy: Policy, level: string): Color {
  const index = policy.levels.indexOf(level);
  if (index < 0) return "red";
  if (index === 0 || policy.levels.length === 1) return "green";
  return index === policy.levels.length - 1 ? "red" : "yellow";
}

/**
 * The footer line: workspace and label, provider and clearance, session level.
 * Without color it reads, for example:
 *   ● mock-workspace [confidential]  ·  google [public] ✗ no access  ·  session public
 */
export function statusLine(input: StatusInput, color = true): string {
  const p = (text: string, c: Color) => paint(text, c, color);
  const policy = input.policy;
  if (input.problem !== undefined || !policy) {
    return `${p("✗", "red")} confidentiality unusable (run /confidentiality)`;
  }

  const badge = (level: string) => p(`[${level}]`, levelColor(policy, level));
  const clearance = clearanceOf(policy, input.provider);
  const taint = input.taint ?? policy.levels[0];
  const allowed = input.level !== undefined && cleared(policy, clearance, input.level);

  const workspacePart =
    input.workspace === undefined || input.level === undefined
      ? `${p("○", "yellow")} no workspace`
      : `${p("●", allowed ? "green" : "red")} ${path.basename(input.workspace)} ${badge(input.level)}`;

  let providerPart = `${input.provider ?? "none"} ${badge(clearance)}`;
  if (input.level !== undefined) providerPart += allowed ? ` ${p("✓", "green")}` : ` ${p("✗ no access", "red")}`;

  let sessionPart = `session ${p(taint, levelColor(policy, taint))}`;
  if (rank(policy, taint) > rank(policy, clearance)) sessionPart += ` ${p("⛔ messages withheld", "red")}`;

  return [workspacePart, providerPart, sessionPart].join(p("  ·  ", "dim"));
}
