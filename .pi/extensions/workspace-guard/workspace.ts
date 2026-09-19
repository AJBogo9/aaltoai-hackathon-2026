import * as fs from "node:fs";
import { loadMetadata } from "./metadata.ts";
import type { Metadata } from "./metadata.ts";
import { resolveWorkspace, within } from "./paths.ts";
import { clearanceOf, cleared, findPolicyFile, loadPolicy, normalizeLevel } from "./policy.ts";
import type { Loaded, Policy } from "./policy.ts";

export type Active = { workspace: string; policy: Policy; meta: Metadata };

/** Everything /workspace requires: a valid folder, a valid policy, and a valid metadata file in the folder. */
export function activateWorkspace(arg: string, cwd: string): Loaded<Active> {
  const dir = resolveWorkspace(arg, cwd);
  if (!dir.ok) return dir;

  const policyFile = findPolicyFile(cwd);
  if (!policyFile) {
    return { ok: false, reason: "No .pi/confidentiality.json found, so the workspace cannot be checked." };
  }
  const policy = loadPolicy(policyFile);
  if (!policy.ok) return policy;

  let policyReal = policyFile;
  try {
    policyReal = fs.realpathSync(policyFile);
  } catch {
    // keep the unresolved path
  }
  if (within(dir.resolved, policyReal)) {
    return { ok: false, reason: "The workspace must not contain the confidentiality policy." };
  }

  const meta = loadMetadata(dir.resolved, policy.value);
  if (!meta.ok) return meta;
  return { ok: true, value: { workspace: dir.resolved, policy: policy.value, meta: meta.value } };
}

/** Summary lines for /workspace and /confidentiality. */
export function describeWorkspace(
  policy: Policy,
  meta: Metadata,
  provider: string | undefined,
  taint: string,
): string[] {
  const clearance = clearanceOf(policy, provider);
  const access = cleared(policy, clearance, meta.level)
    ? "file access is allowed."
    : `all file access will be refused. Switch to a provider cleared for ${meta.level}.`;
  return [
    `Workspace level: ${meta.level}.`,
    `Provider ${provider ?? "(none)"} is cleared for ${clearance}: ${access}`,
    `Session level: ${normalizeLevel(policy, taint)}.`,
  ];
}
