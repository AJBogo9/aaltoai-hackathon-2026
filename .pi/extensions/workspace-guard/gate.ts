import * as path from "node:path";
import { METADATA_NAME, toRel } from "./metadata.ts";
import type { Metadata } from "./metadata.ts";
import { checkWritePath, existsNoFollow, normalizeToolPath, realResolve, within } from "./paths.ts";
import { clearanceOf, cleared, lowest, rank } from "./policy.ts";
import type { Policy } from "./policy.ts";

export type Env = {
  policy: Policy;
  meta: Metadata;
  workspace: string;
  provider: string | undefined;
  /** The session's confidentiality level: the highest level read so far. */
  taint: string;
  cwd: string;
  /** Real paths of the files the agent has created; only these may be modified. */
  created: ReadonlySet<string>;
};

export type ReadDecision = { ok: true; resolved: string; level: string } | { ok: false; reason: string };
export type WriteDecision = { ok: true; resolved: string; readLevel?: string } | { ok: false; reason: string };

function refusal(env: Env, clearance: string): string {
  return `The workspace is labeled ${env.meta.level}, but provider "${env.provider ?? "none"}" is only cleared for ${clearance}. Do not retry with this provider; ask the user to switch to a provider cleared for ${env.meta.level}.`;
}

/**
 * Decide a read-only tool call. Every file in the workspace has the workspace's label, so a provider
 * cleared below it gets no access at all. Reads are confined to the workspace. ls and find return
 * names only, so they do not raise the session level.
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
      resolved = realResolve(path.resolve(env.cwd, normalizeToolPath(requested)));
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
  const level = tool === "read" || tool === "grep" ? env.meta.level : lowest(env.policy);
  return { ok: true, resolved, level };
}

/**
 * Decide a write or edit. It needs a provider cleared for the workspace's level (no writing above the
 * provider's clearance) and a session level no higher than the workspace's (no writing down). Only
 * new paths and files the agent created may be written; everything else is read-only source data.
 */
export function decideWrite(env: Env, tool: string, requested: unknown): WriteDecision {
  const clearance = clearanceOf(env.policy, env.provider);
  if (!cleared(env.policy, clearance, env.meta.level)) return { ok: false, reason: refusal(env, clearance) };
  if (rank(env.policy, env.taint) > rank(env.policy, env.meta.level)) {
    return {
      ok: false,
      reason: `This session is at level ${env.taint}, above the workspace's level ${env.meta.level}. Writing here would lower the label of that data. Use a workspace labeled ${env.taint} or higher, or ask the user to start a new session with /new.`,
    };
  }

  const check = checkWritePath(env.workspace, requested, env.cwd);
  if (!check.ok) return check;
  const resolved = check.resolved;
  const rel = toRel(env.workspace, resolved);

  if (path.posix.basename(rel) === METADATA_NAME) {
    return { ok: false, reason: `${METADATA_NAME} is protected and can only be changed by the user.` };
  }
  if (existsNoFollow(resolved) && !env.created.has(resolved)) {
    return { ok: false, reason: `"${rel}" already exists and is source data, which is read-only. Write a new file instead.` };
  }
  // edit returns the changed text to the model, so it counts as a read.
  return { ok: true, resolved, readLevel: tool === "edit" ? env.meta.level : undefined };
}
