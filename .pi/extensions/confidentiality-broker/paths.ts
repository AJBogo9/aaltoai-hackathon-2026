import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export type PathCheck = { ok: true; resolved: string } | { ok: false; reason: string };

export function expandHome(p: string): string {
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

/** Mirror pi's own path handling (leading @, unicode spaces, ~) so the path we check is the path that runs. */
export function normalizeToolPath(p: string): string {
  const withoutAt = p.startsWith("@") ? p.slice(1) : p;
  return expandHome(withoutAt.replace(/\p{Zs}/gu, " "));
}

/** True when target is root itself or somewhere below it. */
export function within(root: string, target: string): boolean {
  const rel = path.relative(root, target);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel));
}

export function existsNoFollow(p: string): boolean {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Real path of `target`, following symlinks. The path may not exist yet: the nearest
 * existing ancestor is resolved and the missing tail is re-appended. A dangling symlink
 * is rejected because a write would follow it to wherever it points.
 */
export function realResolve(target: string): string {
  let current = path.resolve(target);
  const tail: string[] = [];
  for (;;) {
    try {
      return path.join(fs.realpathSync(current), ...tail.reverse());
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT" && code !== "ENOTDIR") throw err;
      if (existsNoFollow(current)) throw new Error(`dangling symlink at ${current}`);
      const parent = path.dirname(current);
      if (parent === current) throw err;
      tail.push(path.basename(current));
      current = parent;
    }
  }
}

/** Validate a path the agent wants to write. `workspace` must already be a real path; relative paths are resolved against `base`. */
export function checkWritePath(workspace: string, requested: unknown, base: string): PathCheck {
  if (typeof requested !== "string" || requested.trim() === "") {
    return { ok: false, reason: "Missing or empty path." };
  }

  let resolved: string;
  try {
    resolved = realResolve(path.resolve(base, normalizeToolPath(requested)));
  } catch (err) {
    return { ok: false, reason: `Cannot resolve path: ${(err as Error).message}.` };
  }

  if (resolved === workspace) {
    return { ok: false, reason: "That is the workspace folder itself; give a file inside it." };
  }
  if (!within(workspace, resolved)) {
    return { ok: false, reason: `${resolved} is outside the workspace.` };
  }
  return { ok: true, resolved };
}
