import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { METADATA_NAME, loadMetadata, metadataFile } from "./metadata.ts";
import { cleared, loadPolicy } from "./policy.ts";

/**
 * The launch-time check run by scripts/launch.sh, before any container with the workspace starts:
 * is the workspace labeled with a level the policy knows? The label becomes the session's level. Which
 * provider is used is decided later, inside pi: a provider cleared below the label gets no tools.
 * It reuses the policy and metadata code of the extension, so the launcher and pi cannot disagree.
 */
export type Preflight =
  | { ok: true; level: string; clearedProviders: string[] }
  | { ok: false; reason: string };

export function preflight(policyFile: string, workspace: string): Preflight {
  const policy = loadPolicy(policyFile);
  if (!policy.ok) return policy;

  try {
    if (!fs.statSync(workspace).isDirectory()) return { ok: false, reason: `Not a folder: ${workspace}` };
  } catch {
    return { ok: false, reason: `Folder not found: ${workspace}` };
  }

  // The label file must be a plain file: a symlink could point at a label outside the workspace.
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(metadataFile(workspace));
  } catch {
    return { ok: false, reason: `No ${METADATA_NAME} in the workspace. Create it first, for example: {"level": "confidential"}` };
  }
  if (!stat.isFile()) return { ok: false, reason: `${METADATA_NAME} must be a regular file, not a symlink or a folder.` };

  const meta = loadMetadata(workspace, policy.value);
  if (!meta.ok) return meta;

  const level = meta.value.level;
  const clearedProviders = Object.keys(policy.value.providers).filter((p) =>
    cleared(policy.value, policy.value.providers[p], level),
  );
  return { ok: true, level, clearedProviders };
}

function arg(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

/**
 * Prints `key=value` lines that a shell can read without a JSON parser. Exit code: 0 valid,
 * 1 refused (reason on stderr), 2 bad usage.
 */
function main(args: string[]): number {
  const policyFile = arg(args, "--policy");
  const workspace = arg(args, "--workspace");
  if (!policyFile || !workspace) {
    console.error("usage: preflight.ts --policy FILE --workspace DIR");
    return 2;
  }
  const result = preflight(policyFile, path.resolve(workspace));
  if (!result.ok) {
    console.error(result.reason);
    return 1;
  }
  console.log(`level=${result.level}`);
  console.log(`cleared_providers=${result.clearedProviders.join(",")}`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
