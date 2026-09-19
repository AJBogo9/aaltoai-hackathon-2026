import * as fs from "node:fs";
import * as path from "node:path";
import { loadMetadata } from "./metadata.ts";
import type { Policy } from "./policy.ts";

export type Candidate = { rel: string; abs: string; level: string };

const SKIP = new Set(["node_modules", "venv", "target", "dist", "build", "__pycache__"]);
const MAX_DEPTH = 3;
const MAX_FOLDERS = 2000;
const MAX_RESULTS = 50;

/**
 * Folders below `root` that hold a valid .confidentiality.json, for the /workspace picker. Hidden
 * folders, symlinks and common build folders are skipped, and the search is bounded.
 */
export function findWorkspaces(root: string, policy: Policy): Candidate[] {
  const out: Candidate[] = [];
  let visited = 0;

  const walk = (dir: string, depth: number): void => {
    if (depth > MAX_DEPTH) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (visited >= MAX_FOLDERS || out.length >= MAX_RESULTS) return;
      if (!entry.isDirectory() || entry.name.startsWith(".") || SKIP.has(entry.name)) continue;
      visited += 1;
      const abs = path.join(dir, entry.name);
      const meta = loadMetadata(abs, policy);
      if (meta.ok) {
        out.push({ rel: path.relative(root, abs).split(path.sep).join("/"), abs, level: meta.value.level });
      }
      walk(abs, depth + 1);
    }
  };

  walk(root, 1);
  return out.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
}

/** One line of the picker: the folder, its label, and whether the current provider may use it. */
export function pickerLabel(candidate: Candidate, providerCleared: boolean, current: boolean): string {
  const access = providerCleared ? "✓" : "✗ no access";
  return `${candidate.rel}  [${candidate.level}]  ${access}${current ? "  (current)" : ""}`;
}
