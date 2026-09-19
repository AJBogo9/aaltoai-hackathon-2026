import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * Registers the Norrin inference endpoint (Mistral Large 3, served from Finland)
 * as the pi provider `verda`.
 *
 * The key is read here, from the gitignored .env.local, rather than through
 * pi's "$VERDA_API_KEY" config syntax: pi runs under bwrap with --clearenv,
 * so the environment inside the sandbox is empty.
 */

const ENV_FILE = ".env.local";
const DEFAULT_BASE = "https://containers.datacrunch.io/data-sovereignty-mistral-large-3";
const CONTEXT_WINDOW = 262_144;

function readEnvFile(cwd: string): Record<string, string> {
  const file = path.join(cwd, ENV_FILE);
  let text: string;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return {};
  }
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const m = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

/** Strip any /v1... suffix, the way scripts/verda_probe.sh does. */
function normalizeBase(raw: string): string {
  return raw.replace(/\/+$/, "").replace(/\/v1(\/.*)?$/, "");
}

async function discoverModelIds(base: string, key: string): Promise<string[]> {
  const res = await fetch(`${base}/v1/models`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`GET /v1/models -> ${res.status}`);
  const body = (await res.json()) as { data?: Array<{ id?: string }> };
  return (body.data ?? []).map((m) => m.id).filter((id): id is string => !!id);
}

export default async function (pi: ExtensionAPI) {
  const cwd = process.cwd();
  const env = readEnvFile(cwd);
  const key = env.VERDA_API_KEY;
  if (!key) {
    // No key on this machine: stay silent rather than registering a dead provider.
    return;
  }

  const base = normalizeBase(env.VERDA_BASE_URL || DEFAULT_BASE);

  let ids = env.VERDA_MODEL ? [env.VERDA_MODEL] : [];
  if (ids.length === 0) {
    try {
      ids = await discoverModelIds(base, key);
    } catch {
      // Endpoint down or key rejected. Nothing to register; scripts/verda_probe.sh diagnoses it.
      return;
    }
  }
  if (ids.length === 0) return;

  pi.registerProvider("verda", {
    name: "Verda / Norrin (Finland)",
    baseUrl: `${base}/v1`,
    apiKey: key,
    api: "openai-completions",
    models: ids.map((id) => ({
      id,
      name: `${id.split("/").pop()} (Finland)`,
      reasoning: false,
      input: ["text"] as ("text" | "image")[],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: CONTEXT_WINDOW,
      maxTokens: 32_768,
      compat: {
        // vLLM behind an OpenAI-compatible shim: no developer role, no reasoning_effort.
        supportsDeveloperRole: false,
        supportsReasoningEffort: false,
        maxTokensField: "max_tokens" as const,
      },
    })),
  });
}
