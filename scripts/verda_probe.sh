#!/usr/bin/env bash
# Probe the partner's OpenAI-compatible inference endpoint.
# Credentials come from .env.local (gitignored) and are never printed.
#
#   bash scripts/verda_probe.sh
#
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/.env.local"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

BASE="${VERDA_BASE_URL:-https://containers.datacrunch.io/data-sovereignty-mistral-large-3}"
BASE="${BASE%/}"
BASE="${BASE%/v1/chat/completions}"
BASE="${BASE%/v1}"

if [[ -z "${VERDA_API_KEY:-}" ]]; then
  if [[ -f "${ENV_FILE}" ]]; then
    echo "VERDA_API_KEY is empty in ${ENV_FILE}." >&2
    echo "Paste the key into that file. Do NOT copy the example over it again," >&2
    echo "that overwrites whatever you just pasted." >&2
  else
    echo "${ENV_FILE} does not exist. Create it from the example, then paste the key." >&2
  fi
  exit 1
fi

auth=(-H "Authorization: Bearer ${VERDA_API_KEY}" -H 'Content-Type: application/json')

echo "base url : ${BASE}"
echo "api key  : ${#VERDA_API_KEY} chars (value hidden)"

echo
echo "=== 1. GET /v1/models ==="
models_body="$(curl -sS --max-time 90 "${auth[@]}" -w '\n__http=%{http_code}' "${BASE}/v1/models")"
echo "${models_body}" | sed 's/^__http=/status: /'

MODEL="${VERDA_MODEL:-}"
if [[ -z "${MODEL}" ]]; then
  MODEL="$(printf '%s' "${models_body}" | sed 's/__http=.*//' \
    | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"][0]["id"])' 2>/dev/null)"
fi

if [[ -z "${MODEL}" ]]; then
  echo
  echo "Could not discover a model id from /v1/models." >&2
  echo "Set VERDA_MODEL in .env.local to the name the partner gave you, then re-run." >&2
  exit 2
fi

echo
echo "=== 2. POST /v1/chat/completions (model: ${MODEL}) ==="
payload="$(python3 - "${MODEL}" <<'PY'
import json, sys
print(json.dumps({
    "model": sys.argv[1],
    "messages": [{"role": "user", "content": "Reply with exactly: endpoint works"}],
    "max_tokens": 16,
    "stream": False,
}))
PY
)"

curl -sS --max-time 180 "${auth[@]}" \
  -w '\nstatus: %{http_code}  time: %{time_total}s\n' \
  -X POST "${BASE}/v1/chat/completions" \
  -d "${payload}"
