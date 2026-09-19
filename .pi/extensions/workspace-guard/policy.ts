import * as fs from "node:fs";
import * as path from "node:path";

export type Policy = { levels: string[]; providers: Record<string, string> };
export type Loaded<T> = { ok: true; value: T } | { ok: false; reason: string };

export const POLICY_RELATIVE = path.join(".pi", "confidentiality.json");

export function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

/** Walk up from cwd and return the nearest .pi/confidentiality.json. */
export function findPolicyFile(cwd: string): string | undefined {
  let dir = path.resolve(cwd);
  for (;;) {
    const candidate = path.join(dir, POLICY_RELATIVE);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

export function parsePolicy(raw: unknown): Loaded<Policy> {
  if (!isRecord(raw)) return { ok: false, reason: "The policy must be a JSON object." };

  const levels = raw.levels;
  if (
    !Array.isArray(levels) ||
    levels.length === 0 ||
    !levels.every((l) => typeof l === "string" && l.trim() !== "") ||
    new Set(levels).size !== levels.length
  ) {
    return { ok: false, reason: '"levels" must be a non-empty list of unique level names, lowest first.' };
  }

  const rawProviders = raw.providers ?? {};
  if (!isRecord(rawProviders)) {
    return { ok: false, reason: '"providers" must be an object mapping provider ids to levels.' };
  }
  const providers: Record<string, string> = {};
  for (const [provider, level] of Object.entries(rawProviders)) {
    if (typeof level !== "string" || !levels.includes(level)) {
      return { ok: false, reason: `Provider "${provider}" has an unknown level.` };
    }
    providers[provider] = level;
  }
  return { ok: true, value: { levels: levels as string[], providers } };
}

export function loadPolicy(file: string): Loaded<Policy> {
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    return { ok: false, reason: `Cannot read the confidentiality policy (${file}): ${(err as Error).message}` };
  }
  return parsePolicy(raw);
}

export function lowest(policy: Policy): string {
  return policy.levels[0];
}

export function highest(policy: Policy): string {
  return policy.levels[policy.levels.length - 1];
}

export function rank(policy: Policy, level: string): number {
  return policy.levels.indexOf(level);
}

export function maxLevel(policy: Policy, a: string, b: string): string {
  return rank(policy, a) >= rank(policy, b) ? a : b;
}

/** A provider's clearance. Unknown or missing providers get the lowest level. */
export function clearanceOf(policy: Policy, provider: string | undefined): string {
  if (provider !== undefined && Object.hasOwn(policy.providers, provider)) return policy.providers[provider];
  return lowest(policy);
}

/** True when a provider cleared for `clearance` may see data labeled `level`: same or higher. */
export function cleared(policy: Policy, clearance: string, level: string): boolean {
  return rank(policy, clearance) >= rank(policy, level);
}

/** Empty means "nothing read yet" (lowest). A level the policy no longer knows fails closed to the highest. */
export function normalizeLevel(policy: Policy, level: string): string {
  if (level === "") return lowest(policy);
  return policy.levels.includes(level) ? level : highest(policy);
}
