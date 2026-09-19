import type { Metadata } from "./metadata.ts";
import { clearanceOf, cleared, normalizeLevel } from "./policy.ts";
import type { Policy } from "./policy.ts";

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
