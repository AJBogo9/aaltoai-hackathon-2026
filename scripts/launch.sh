#!/usr/bin/env bash
# Launch pi on ONE workspace, inside a container that sees nothing else.
#
#   scripts/launch.sh [--dry-run] <workspace> [-- pi args...]
#
# 1. Checks that the workspace has a valid .confidentiality.json. Its label becomes the confidentiality
#    level of the whole session. Nothing starts without one.
# 2. Starts pi in a container where only the workspace is writable. The repo is not mounted, the
#    label file is read-only, and the guard, skills and policy are read-only.
#
# The provider and model are chosen in pi, as usual (/model, or `-- --provider X --model Y`). A provider
# cleared below the workspace label gets no tools and no messages; the workspace guard extension enforces that.
# The workspace cannot be changed after launch: start a new session to use another one.
# --dry-run runs the check and prints the command without starting pi.

# Sourcing would run set -e and exit inside your own shell and close the terminal.
if (return 0 2>/dev/null); then
  echo "launch: run this script, do not source it: scripts/launch.sh --help" >&2
  return 1
fi

set -euo pipefail

usage() {
  cat >&2 <<'EOF'
usage: scripts/launch.sh [--dry-run] [--rebuild] <workspace> [-- pi args...]

  workspace  folder with a .confidentiality.json, e.g. demo/confidential-hr
  --rebuild  rebuild the image first (needed after the Dockerfile changes)
  pi args    passed to pi after `--`, e.g. -- --provider mistral

environment:
  CONTAINER_RUNTIME  docker or podman (default: docker if present, else podman)
  PI_IMAGE           image to run (default: ai-hackathon-pi:latest, built when missing)
  PI_MODELS_FILE     optional pi models.json (custom providers such as lemonade), mounted read-only
EOF
  exit 2
}

die() {
  echo "launch: $*" >&2
  exit 1
}

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
POLICY="$REPO/.pi/confidentiality.json"
GUARD="$REPO/.pi/extensions/workspace-guard"
SKILLS="$REPO/.pi/skills"
VERDA_EXT="$REPO/.pi/extensions/verda.ts"
ENV_LOCAL="$REPO/.env.local"

DRY_RUN=0
REBUILD=0
POSITIONAL=()
PI_EXTRA=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --rebuild) REBUILD=1 ;;
    -h | --help) usage ;;
    --)
      shift
      PI_EXTRA=("$@")
      break
      ;;
    -*) echo "launch: unknown option: $1" >&2; usage ;;
    *) POSITIONAL+=("$1") ;;
  esac
  shift
done
[[ ${#POSITIONAL[@]} -eq 1 ]] || usage
WS_ARG="${POSITIONAL[0]}"

# --- The workspace folder. The extension does not repeat these checks: it trusts what this script passes in.
[[ -d "$WS_ARG" ]] || die "Folder not found: $WS_ARG"
WS="$(cd "$WS_ARG" && pwd -P)"
# These characters would break the mount options below.
if [[ "$WS" == *[:,]* || "$WS" == *$'\n'* ]]; then
  die "The workspace path must not contain ':', ',' or a newline: $WS"
fi
# The repo must not be inside the workspace (this also rules out the repo itself and its parents).
if [[ "$REPO/" == "${WS%/}/"* ]]; then
  die "The workspace must not contain the project folder ($REPO)."
fi
for protected in .pi .git .devcontainer .claude; do
  if [[ "$WS/" == "$REPO/$protected/"* ]]; then
    die "The workspace must not be inside $protected."
  fi
done
[[ -f "$POLICY" ]] || die "No policy found: $POLICY"
[[ -f "$WS/.confidentiality.json" && ! -L "$WS/.confidentiality.json" ]] ||
  die "$WS has no .confidentiality.json (it must be a regular file). Create it first, for example: {\"level\": \"confidential\"}"

# --- Container runtime and image.
RT="${CONTAINER_RUNTIME:-}"
if [[ -z "$RT" ]]; then
  if command -v docker >/dev/null 2>&1; then
    RT=docker
  elif command -v podman >/dev/null 2>&1; then
    RT=podman
  else
    die "Neither docker nor podman was found."
  fi
fi
USER_ARGS=(--user "$(id -u):$(id -g)")
if "$RT" --version 2>/dev/null | grep -qi podman; then
  # Rootless podman: keep the host user's id so files written in the workspace stay owned by you.
  USER_ARGS=(--userns=keep-id "${USER_ARGS[@]}")
fi

IMAGE="${PI_IMAGE:-ai-hackathon-pi:latest}"
if [[ $REBUILD -eq 1 ]] || ! "$RT" image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "launch: building $IMAGE..." >&2
  "$RT" build -q -t "$IMAGE" -f "$REPO/.devcontainer/Dockerfile" "$REPO/.devcontainer" >/dev/null ||
    die "Could not build $IMAGE."
fi

# --- The confidentiality check. It runs in the image, with no network, on the same code the extension uses.
PREFLIGHT=("$RT" run --rm --network none --read-only --cap-drop=ALL --security-opt=no-new-privileges "${USER_ARGS[@]}"
  --mount "type=bind,src=$WS,dst=/mnt/workspace,readonly"
  --mount "type=bind,src=$POLICY,dst=/opt/guard/policy.json,readonly"
  --mount "type=bind,src=$GUARD,dst=/opt/guard/extensions/workspace-guard,readonly"
  "$IMAGE" node /opt/guard/extensions/workspace-guard/preflight.ts
  --policy /opt/guard/policy.json --workspace /mnt/workspace)

if ! RESULT="$("${PREFLIGHT[@]}")"; then
  die "refused: not starting pi."
fi
LEVEL="" CLEARED=""
while IFS='=' read -r key value; do
  case "$key" in
    level) LEVEL="$value" ;;
    cleared_providers) CLEARED="$value" ;;
  esac
done <<<"$RESULT"
[[ -n "$LEVEL" ]] || die "The check returned no level."

# --- API keys. Which provider gets used is decided inside pi, so pass in every key that is set on the
# host. The variable is named without a value: it is read from the host and never appears in the command
# line. A provider cleared below the label can be selected but gets no tools.
KEY_ARGS=()
for var in GEMINI_API_KEY OPENAI_API_KEY MISTRAL_API_KEY ANTHROPIC_API_KEY; do
  if [[ -n "${!var:-}" ]]; then KEY_ARGS+=(-e "$var"); fi
done
# --- Verda / Norrin. That provider is not built into pi: it is registered by .pi/extensions/verda.ts,
# which reads its key from the gitignored .env.local. The repo is not mounted, so mount exactly those two
# files, both read-only and both OUTSIDE the workspace, so the agent cannot read the key. The env file's
# path is passed in, since the extension's default (./.env.local) would resolve inside the workspace.
VERDA_MOUNTS=()
VERDA_EXT_ARGS=()
if [[ -f "$VERDA_EXT" && -f "$ENV_LOCAL" ]] && grep -Eq '^[[:space:]]*(export[[:space:]]+)?VERDA_API_KEY[[:space:]]*=[[:space:]]*[^[:space:]]' "$ENV_LOCAL"; then
  VERDA_MOUNTS=(
    --mount "type=bind,src=$VERDA_EXT,dst=/opt/guard/extensions/verda.ts,readonly"
    --mount "type=bind,src=$ENV_LOCAL,dst=/opt/guard/verda.env,readonly"
    -e VERDA_ENV_FILE=/opt/guard/verda.env)
  VERDA_EXT_ARGS=(-e /opt/guard/extensions/verda.ts)
fi

if [[ ${#KEY_ARGS[@]} -eq 0 && ${#VERDA_EXT_ARGS[@]} -eq 0 ]]; then
  echo "launch: warning: no provider key found (GEMINI/OPENAI/MISTRAL/ANTHROPIC_API_KEY in the environment, or VERDA_API_KEY in .env.local); only local providers will work." >&2
fi

# --- Start pi. Only /workspace is writable; everything else in the container is read-only.
TTY_ARGS=(-i)
if [[ -t 0 && -t 1 ]]; then TTY_ARGS=(-it); fi

RUN=("$RT" run --rm --init "${TTY_ARGS[@]}" "${USER_ARGS[@]}"
  --read-only --tmpfs /tmp:rw,mode=1777,size=512m
  --cap-drop=ALL --security-opt=no-new-privileges --pids-limit=512 --memory=4g --memory-swap=4g
  --add-host=host.docker.internal:host-gateway
  --mount "type=bind,src=$WS,dst=/workspace"
  --mount "type=bind,src=$WS/.confidentiality.json,dst=/workspace/.confidentiality.json,readonly"
  --mount "type=bind,src=$GUARD,dst=/opt/guard/extensions/workspace-guard,readonly"
  --mount "type=bind,src=$SKILLS,dst=/opt/guard/skills,readonly"
  --mount "type=bind,src=$POLICY,dst=/opt/guard/policy.json,readonly"
  --workdir /workspace
  -e HOME=/tmp/home -e PI_CODING_AGENT_DIR=/tmp/pi-agent
  -e PI_WORKSPACE=/workspace -e "PI_WORKSPACE_LEVEL=$LEVEL" -e PI_POLICY_FILE=/opt/guard/policy.json
  -e PI_SANDBOXED=1 -e PI_OFFLINE=1 -e PI_TELEMETRY=0
  ${KEY_ARGS[@]+"${KEY_ARGS[@]}"}
  ${VERDA_MOUNTS[@]+"${VERDA_MOUNTS[@]}"})
if [[ -n "${PI_MODELS_FILE:-}" ]]; then
  [[ -f "$PI_MODELS_FILE" ]] || die "PI_MODELS_FILE is not a file: $PI_MODELS_FILE"
  RUN+=(--mount "type=bind,src=$(cd "$(dirname "$PI_MODELS_FILE")" && pwd -P)/$(basename "$PI_MODELS_FILE"),dst=/tmp/pi-agent/models.json,readonly")
fi
RUN+=("$IMAGE" pi
  --no-extensions -e /opt/guard/extensions/workspace-guard/index.ts
  ${VERDA_EXT_ARGS[@]+"${VERDA_EXT_ARGS[@]}"}
  --no-skills --skill /opt/guard/skills
  --no-approve --no-context-files
  --tools read,bash,edit,write,grep,find,ls
  --session-dir /workspace/.pi-sessions)
RUN+=(${PI_EXTRA[@]+"${PI_EXTRA[@]}"})

echo "launch: workspace $WS is labeled $LEVEL. Providers cleared for it: ${CLEARED:-(none listed)}. Any other provider gets no tools." >&2
if [[ $DRY_RUN -eq 1 ]]; then
  echo "launch: dry run, not starting pi. Command:" >&2
  printf '%q ' "${RUN[@]}" >&2
  echo >&2
  exit 0
fi
exec "${RUN[@]}"
