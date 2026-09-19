import * as fs from "node:fs";
import * as path from "node:path";
import type { Metadata } from "./metadata.ts";
import { loadPolicy } from "./policy.ts";
import type { Loaded, Policy } from "./policy.ts";

/**
 * What scripts/launch.sh tells the extension. The workspace is fixed for the whole session: it is
 * chosen at launch, and the launcher has already validated its label and mounted it. Nothing in the
 * session can change it, so the label comes from the environment and .confidentiality.json is not
 * read again.
 *
 *   PI_POLICY_FILE      the confidentiality policy (read-only in the container)
 *   PI_WORKSPACE        the workspace folder
 *   PI_WORKSPACE_LEVEL  its label
 *   PI_SANDBOXED=1      pi runs in the launcher's container, so bash is confined to the workspace
 */
export type Config = { policy: Policy; workspace: string; meta: Metadata; sandboxed: boolean };

export function isSandboxed(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.PI_SANDBOXED === "1";
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Loaded<Config> {
  const fix = "Start pi with scripts/launch.sh <workspace>.";

  const policyFile = env.PI_POLICY_FILE;
  if (!policyFile) return { ok: false, reason: `PI_POLICY_FILE is not set. ${fix}` };
  const policy = loadPolicy(policyFile);
  if (!policy.ok) return policy;

  const requested = env.PI_WORKSPACE;
  if (!requested || !path.isAbsolute(requested)) {
    return { ok: false, reason: `PI_WORKSPACE is not set to an absolute path. ${fix}` };
  }
  let workspace: string;
  try {
    workspace = fs.realpathSync(requested);
    if (!fs.statSync(workspace).isDirectory()) return { ok: false, reason: `The workspace is not a folder: ${workspace}` };
  } catch {
    return { ok: false, reason: `The workspace folder does not exist: ${requested}` };
  }

  const level = env.PI_WORKSPACE_LEVEL;
  if (!level || !policy.value.levels.includes(level)) {
    return { ok: false, reason: `PI_WORKSPACE_LEVEL must be one of: ${policy.value.levels.join(", ")}. ${fix}` };
  }
  return { ok: true, value: { policy: policy.value, workspace, meta: { level }, sandboxed: isSandboxed(env) } };
}
