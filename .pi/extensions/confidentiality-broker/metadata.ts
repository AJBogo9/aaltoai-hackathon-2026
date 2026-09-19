import * as fs from "node:fs";
import * as path from "node:path";
import { isRecord } from "./policy.ts";
import type { Loaded, Policy } from "./policy.ts";

export const METADATA_NAME = ".confidentiality.json";

/** One label for the whole workspace: every file and folder in it has this level. */
export type Metadata = { level: string };

const EXAMPLE = '{"level": "confidential"}';

export function metadataFile(workspace: string): string {
  return path.join(workspace, METADATA_NAME);
}

export function toRel(workspace: string, abs: string): string {
  return path.relative(workspace, abs).split(path.sep).join("/");
}

export function parseMetadata(raw: unknown, policy: Policy): Loaded<Metadata> {
  if (!isRecord(raw)) return { ok: false, reason: `${METADATA_NAME} must be a JSON object.` };
  const extra = Object.keys(raw).filter((key) => key !== "level");
  if (extra.length > 0) {
    return {
      ok: false,
      reason: `${METADATA_NAME} has unsupported keys (${extra.join(", ")}). It holds a single label for the whole workspace, for example: ${EXAMPLE}`,
    };
  }
  if (typeof raw.level !== "string" || !policy.levels.includes(raw.level)) {
    return { ok: false, reason: `"level" in ${METADATA_NAME} must be one of: ${policy.levels.join(", ")}.` };
  }
  return { ok: true, value: { level: raw.level } };
}

export function loadMetadata(workspace: string, policy: Policy): Loaded<Metadata> {
  let text: string;
  try {
    text = fs.readFileSync(metadataFile(workspace), "utf8");
  } catch {
    return { ok: false, reason: `No ${METADATA_NAME} in ${workspace}. Create it first, for example: ${EXAMPLE}` };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    return { ok: false, reason: `${METADATA_NAME} is not valid JSON: ${(err as Error).message}` };
  }
  return parseMetadata(raw, policy);
}
