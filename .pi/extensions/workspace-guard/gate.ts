import * as path from "node:path";
import { METADATA_NAME, toRel } from "./metadata.ts";
import type { Metadata } from "./metadata.ts";
import { checkWritePath, normalizeToolPath, realResolve, within } from "./paths.ts";
import { clearanceOf, cleared } from "./policy.ts";
import type { Policy } from "./policy.ts";

export type Env = {
  policy: Policy;
  /** The workspace label. Every file in the workspace has it. */
  meta: Metadata;
  workspace: string;
  provider: string | undefined;
  /** pi runs in the launcher's container, so bash is confined to the workspace. */
  sandboxed: boolean;
};

export type ReadDecision = { ok: true; resolved: string; level: string } | { ok: false; reason: string };
export type WriteDecision = { ok: true; resolved: string } | { ok: false; reason: string };
export type ShellDecision = { ok: true } | { ok: false; reason: string };

function refusal(env: Env, clearance: string): string {
  return `The workspace is labeled ${env.meta.level}, but provider "${env.provider ?? "none"}" is only cleared for ${clearance}. Do not retry with this provider; ask the user to switch to a provider cleared for ${env.meta.level}.`;
}

/**
 * Decide a read-only tool call. Every file in the workspace has the workspace's label, so a provider
 * cleared below it gets no access at all. Reads are confined to the workspace, and relative paths are
 * relative to the workspace: it is the agent's working directory.
 */
export function decideRead(env: Env, tool: string, requested: unknown): ReadDecision {
  const clearance = clearanceOf(env.policy, env.provider);
  if (!cleared(env.policy, clearance, env.meta.level)) return { ok: false, reason: refusal(env, clearance) };

  let resolved: string;
  if (requested === undefined || requested === null || (typeof requested === "string" && requested.trim() === "")) {
    if (tool === "read") return { ok: false, reason: "Missing or empty path." };
    resolved = env.workspace;
  } else if (typeof requested !== "string") {
    return { ok: false, reason: "The path must be a string." };
  } else {
    try {
      resolved = realResolve(path.resolve(env.workspace, normalizeToolPath(requested)));
    } catch (err) {
      return { ok: false, reason: `Cannot resolve path: ${(err as Error).message}.` };
    }
  }
  if (!within(env.workspace, resolved)) {
    return {
      ok: false,
      reason: `${resolved} is outside the workspace ${env.workspace}. Reads are limited to the workspace.`,
    };
  }
  return { ok: true, resolved, level: env.meta.level };
}

/**
 * Decide a write or edit. It needs a provider cleared for the workspace's label, and the path must be a
 * file inside the workspace. .confidentiality.json is protected. Relative paths are relative to the
 * workspace.
 */
export function decideWrite(env: Env, _tool: string, requested: unknown): WriteDecision {
  const clearance = clearanceOf(env.policy, env.provider);
  if (!cleared(env.policy, clearance, env.meta.level)) return { ok: false, reason: refusal(env, clearance) };

  const check = checkWritePath(env.workspace, requested, env.workspace);
  if (!check.ok) return check;
  const rel = toRel(env.workspace, check.resolved);
  if (path.posix.basename(rel) === METADATA_NAME) {
    return { ok: false, reason: `${METADATA_NAME} is protected and can only be changed by the user.` };
  }
  return { ok: true, resolved: check.resolved };
}

/**
 * Decide a bash call. A command cannot be confined by checking a path, so bash is allowed only when the
 * launcher's container is the boundary, and only for a provider cleared for the workspace label,
 * because anything the command reads is data the model sees.
 */
export function decideShell(env: Env): ShellDecision {
  if (!env.sandboxed) {
    return {
      ok: false,
      reason: "The bash tool is only available when pi is started with scripts/launch.sh, which confines it to the workspace.",
    };
  }
  const clearance = clearanceOf(env.policy, env.provider);
  if (!cleared(env.policy, clearance, env.meta.level)) return { ok: false, reason: refusal(env, clearance) };
  return { ok: true };
}
