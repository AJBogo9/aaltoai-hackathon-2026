import * as fs from "node:fs";
import * as http from "node:http";
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
  // scripts/launch.sh mounts .env.local outside the workspace and names it here, because the repo is
  // not mounted in the container and cwd is the workspace.
  const file = process.env.VERDA_ENV_FILE || path.join(cwd, ENV_FILE);
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

const ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** The endpoint requires tool call ids to be exactly 9 alphanumeric characters. */
function randomAlnumId(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  return out;
}

/**
 * The endpoint sometimes emits tool calls as literal text in `message.content`
 * instead of the structured `tool_calls` field: `[TOOL_CALLS]write{"path": "...",
 * "content": "..."}`, one or more `name{json}` pairs back to back after the
 * marker, no array brackets, no separators. Parse that back into proper
 * `tool_calls` so pi can act on it instead of printing it as text.
 */
function extractInlineToolCalls(
  content: string | null | undefined,
): { content: string; toolCalls: Array<{ name: string; arguments: string }> } | null {
  if (!content) return null;
  const marker = "[TOOL_CALLS]";
  const i = content.indexOf(marker);
  if (i === -1) return null;

  const before = content.slice(0, i);
  let rest = content.slice(i + marker.length);
  const toolCalls: Array<{ name: string; arguments: string }> = [];

  while (true) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*(\{)/.exec(rest);
    if (!m) break;

    const name = m[1];
    const braceStart = m.index + m[0].length - 1;
    let depth = 0;
    let inString = false;
    let escaped = false;
    let end = -1;
    for (let j = braceStart; j < rest.length; j++) {
      const ch = rest[j];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          end = j + 1;
          break;
        }
      }
    }
    if (end === -1) break; // unbalanced/truncated - stop, keep what we parsed so far

    const raw = rest.slice(braceStart, end);
    try {
      JSON.parse(raw); // validate; re-serialize the original text as arguments
    } catch {
      break;
    }
    toolCalls.push({ name, arguments: raw });
    rest = rest.slice(end);
  }

  if (toolCalls.length === 0) return null;
  return { content: before, toolCalls };
}

/**
 * The endpoint drops tool calls when it streams: with `stream: true` and
 * `tool_choice: "auto"` the SSE body carries no tool_calls and ends
 * `finish_reason: "stop"`, so pi sees an empty assistant message and the turn
 * ends with nothing shown. The same request with `stream: false` returns a
 * correct tool call. (`tool_choice: "required"` streams fine, which places the
 * bug in the server's streaming tool-call parser, not in the model.)
 *
 * So: a loopback proxy that takes pi's streaming request, calls the endpoint
 * unstreamed, and replays the answer as a one-shot SSE stream. Replies arrive
 * in a block instead of token by token; tool calls work. Drop it once the
 * endpoint's streaming parser is fixed.
 */
async function startUnstreamProxy(base: string, key: string): Promise<string> {
  const server = http.createServer((req, res) => {
    void (async () => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);

      let body: Record<string, unknown>;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        res.writeHead(400, { "content-type": "application/json" });
        res.end('{"error":{"message":"proxy: body is not JSON"}}');
        return;
      }

      const wantsStream = body.stream === true;
      const { stream: _s, stream_options: _o, ...rest } = body;

      let upstream: Response;
      try {
        upstream = await fetch(`${base}${req.url ?? "/v1/chat/completions"}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ...rest, stream: false }),
        });
      } catch (err) {
        res.writeHead(502, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: { message: `proxy: ${(err as Error).message}` } }));
        return;
      }

      const text = await upstream.text();
      if (!upstream.ok) {
        res.writeHead(upstream.status, { "content-type": upstream.headers.get("content-type") ?? "application/json" });
        res.end(text);
        return;
      }

      const done = JSON.parse(text);
      const choice = done.choices?.[0] ?? {};
      const message = choice.message ?? {};

      if (!message.tool_calls?.length) {
        const inline = extractInlineToolCalls(message.content);
        if (inline) {
          message.content = inline.content;
          // The endpoint requires tool call ids to be exactly 9 alphanumeric chars.
          message.tool_calls = inline.toolCalls.map((call) => ({
            id: randomAlnumId(9),
            type: "function",
            function: { name: call.name, arguments: call.arguments },
          }));
          if (choice.finish_reason === "stop") choice.finish_reason = "tool_calls";
        }
      }

      if (!wantsStream) {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(done));
        return;
      }

      const head = { id: done.id, object: "chat.completion.chunk", created: done.created, model: done.model };

      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
      const send = (delta: unknown, finish: string | null, usage?: unknown) => {
        const chunk: Record<string, unknown> = { ...head, choices: [{ index: 0, delta, finish_reason: finish }] };
        if (usage) chunk.usage = usage;
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      };

      send({ role: "assistant" }, null);
      if (message.content) send({ content: message.content }, null);
      for (const [index, call] of (message.tool_calls ?? []).entries()) {
        send(
          {
            tool_calls: [
              {
                index,
                id: call.id,
                type: "function",
                function: { name: call.function?.name, arguments: call.function?.arguments ?? "{}" },
              },
            ],
          },
          null,
        );
      }
      send({}, choice.finish_reason ?? "stop", done.usage);
      res.write("data: [DONE]\n\n");
      res.end();
    })();
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  server.unref();
  const port = (server.address() as { port: number }).port;
  return `http://127.0.0.1:${port}`;
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

  // Model discovery goes straight to the endpoint; chat goes through the proxy.
  const proxy = await startUnstreamProxy(base, key);

  pi.registerProvider("verda", {
    name: "Verda / Norrin (Finland)",
    baseUrl: `${proxy}/v1`,
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
