import * as path from "node:path";
import { clearanceOf, cleared, rank } from "./policy.ts";
import type { Policy } from "./policy.ts";
import { BASIC, RGB } from "./brand.generated.ts";
import type { Paint } from "./brand.generated.ts";

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

export type { Paint } from "./brand.generated.ts";

const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

/**
 * True when the terminal says it can show 24 bit colour, which is the only way to print
 * the design system's own level colours rather than an approximation of them.
 */
export function supportsTruecolor(env: Record<string, string | undefined> = process.env): boolean {
  const depth = (env.COLORTERM ?? "").toLowerCase();
  return depth === "truecolor" || depth === "24bit";
}

let truecolor = supportsTruecolor();

/** For a caller that knows better than COLORTERM, and for the tests. */
export function setTruecolor(on: boolean): void {
  truecolor = on;
}

function code(color: Paint): string {
  if (color === "dim") return DIM;
  if (!truecolor) return BASIC[color];
  const [r, g, b] = RGB[color];
  return `\x1b[38;2;${r};${g};${b}m`;
}

export function paint(text: string, color: Paint, on: boolean): string {
  return on ? `${code(color)}${text}${RESET}` : text;
}

export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * The lowest level is painted allow, the highest refuse, everything between between.
 * An unknown level is refuse, because an unknown label fails closed.
 */
export function levelColor(policy: Policy, level: string): Paint {
  const index = policy.levels.indexOf(level);
  if (index < 0) return "refuse";
  if (index === 0 || policy.levels.length === 1) return "allow";
  return index === policy.levels.length - 1 ? "refuse" : "between";
}

/**
 * The footer line: workspace and label, provider and clearance, session level.
 * Without color it reads, for example:
 *   ● mock-workspace [confidential]  ·  google [public] ✗ no access  ·  session public
 */
export function statusLine(input: StatusInput, color = true): string {
  const p = (text: string, c: Paint) => paint(text, c, color);
  const policy = input.policy;
  if (input.problem !== undefined || !policy) {
    return `${p("✗", "refuse")} confidentiality unusable (run /confidentiality)`;
  }

  const badge = (level: string) => p(`[${level}]`, levelColor(policy, level));
  const clearance = clearanceOf(policy, input.provider);
  const taint = input.taint ?? policy.levels[0];
  const allowed = input.level !== undefined && cleared(policy, clearance, input.level);

  const workspacePart =
    input.workspace === undefined || input.level === undefined
      ? `${p("○", "dim")} no workspace`
      : `${p("●", allowed ? "allow" : "refuse")} ${path.basename(input.workspace)} ${badge(input.level)}`;

  let providerPart = `${input.provider ?? "none"} ${badge(clearance)}`;
  if (input.level !== undefined) providerPart += allowed ? ` ${p("✓", "allow")}` : ` ${p("✗ no access", "refuse")}`;

  let sessionPart = `session ${p(taint, levelColor(policy, taint))}`;
  if (rank(policy, taint) > rank(policy, clearance)) sessionPart += ` ${p("⛔ messages withheld", "refuse")}`;

  return [workspacePart, providerPart, sessionPart].join(p("  ·  ", "dim"));
}
