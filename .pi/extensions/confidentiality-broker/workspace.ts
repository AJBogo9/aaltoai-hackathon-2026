import type { WorkspaceEntry } from "./config.ts";
import type { Metadata } from "./metadata.ts";
import { clearanceOf, cleared, lowest, normalizeLevel, rank } from "./policy.ts";
import type { Policy } from "./policy.ts";
import { levelColor, paint } from "./status.ts";
import type { Paint } from "./status.ts";

/** Summary lines for /confidentiality. */
export function describeWorkspace(
  policy: Policy,
  meta: Metadata,
  provider: string | undefined,
  taint: string,
): string[] {
  const clearance = clearanceOf(policy, provider);
  const access = cleared(policy, clearance, meta.level)
    ? "tools are allowed."
    : `every tool will be refused. Switch to a provider cleared for ${meta.level}.`;
  return [
    `Workspace level: ${meta.level}.`,
    `Provider ${provider ?? "(none)"} is cleared for ${clearance}: ${access}`,
    `Session level: ${normalizeLevel(policy, taint)}.`,
  ];
}

/**
 * Lines for /providers: every provider in the policy, highest clearance first, and whether it may use the
 * workspace. Levels are colored as in the footer. Columns are padded before painting, so they line up.
 */
export function describeProviders(
  policy: Policy,
  level: string,
  current: string | undefined,
  color = true,
): string[] {
  const p = (text: string, c: Paint) => paint(text, c, color);
  const lvl = (l: string, width = 0) => p(l.padEnd(width), levelColor(policy, l));
  const access = (clearance: string) =>
    cleared(policy, clearance, level) ? p("✓ cleared", "allow") : p("✗ no access", "refuse");

  const providers = Object.entries(policy.providers).sort(
    ([a, la], [b, lb]) => rank(policy, lb) - rank(policy, la) || a.localeCompare(b),
  );
  const nameWidth = Math.max(0, ...providers.map(([name]) => name.length));
  const levelWidth = Math.max(...policy.levels.map((l) => l.length));
  const lines = providers.map(([name, clearance]) => {
    const mark = name === current ? `  ${p("← current", "dim")}` : "";
    return `  ${name.padEnd(nameWidth)}  ${lvl(clearance, levelWidth)}  ${access(clearance)}${mark}`;
  });
  if (providers.length === 0) lines.push(`  ${p("(none listed)", "dim")}`);

  const tail = [
    p(`Levels, lowest first: `, "dim") + policy.levels.map((l) => lvl(l)).join(p(", ", "dim")),
    p(`Any provider not listed is cleared for `, "dim") + lvl(lowest(policy)),
  ];
  if (current !== undefined && !Object.hasOwn(policy.providers, current)) {
    tail.unshift(`Current provider ${current} is not listed: ${lvl(lowest(policy))}, ${access(lowest(policy))}`);
  }
  return [`Provider clearances for this workspace (${lvl(level)}):`, ...lines, ...tail];
}

/**
 * Lines for /workspaces: every labeled folder the launcher found, its label, and whether the current provider
 * would be cleared for it. This session's entry uses the checked label, not the one read loosely by the
 * launcher. A label the policy does not know is shown as invalid, and no provider is cleared for it.
 */
export function describeWorkspaces(
  policy: Policy,
  found: WorkspaceEntry[],
  current: { name: string | undefined; level: string },
  provider: string | undefined,
  color = true,
): string[] {
  const p = (text: string, c: Paint) => paint(text, c, color);
  const clearance = clearanceOf(policy, provider);

  const entries = found.map((e) => (e.name === current.name ? { ...e, level: current.level } : e));
  if (current.name !== undefined && !entries.some((e) => e.name === current.name)) {
    entries.push({ name: current.name, level: current.level });
  }
  if (entries.length === 0) return [`Workspaces: ${p("(none found; start pi with scripts/launch.sh)", "dim")}`];

  const nameWidth = Math.max(...entries.map((e) => e.name.length));
  const levelWidth = Math.max("invalid".length, ...policy.levels.map((l) => l.length));
  const lines = entries.map(({ name, level }) => {
    const known = policy.levels.includes(level);
    const label = known ? p(level.padEnd(levelWidth), levelColor(policy, level)) : p("invalid".padEnd(levelWidth), "refuse");
    const access = known && cleared(policy, clearance, level) ? p("✓", "allow") : p("✗", "refuse");
    const mark = name === current.name ? `  ${p("← this session", "dim")}` : "";
    return `  ${name.padEnd(nameWidth)}  ${label}  ${access}${mark}`;
  });
  return [
    `Workspaces (✓ = ${provider ?? "(none)"} would be cleared):`,
    ...lines,
    p("To use another one, exit and run scripts/launch.sh <folder>.", "dim"),
  ];
}
