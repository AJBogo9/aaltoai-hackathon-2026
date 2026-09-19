#!/usr/bin/env bash
# Run tofu with the credentials the verda CLI already stores.
#
# The Verda provider reads only VERDA_CLIENT_ID / VERDA_CLIENT_SECRET from the
# environment; it does not read the CLI credentials file. This wrapper bridges
# that gap so the secret lives in exactly one place on disk and never lands in
# a shell rc, a tfvars file or the repo.
#
#   ./infra/tofu.sh plan
#   ./infra/tofu.sh apply
#
# The values are exported into this process only. Nothing is printed.
set -euo pipefail

CREDS="${VERDA_SHARED_CREDENTIALS_FILE:-${HOME}/.verda/credentials}"
PROFILE="${VERDA_PROFILE:-default}"

if [[ ! -f "${CREDS}" ]]; then
  echo "No credentials at ${CREDS}. Run: verda auth login" >&2
  exit 1
fi

# Pull the two keys out of the [profile] section of the INI file.
read_key() {
  awk -v profile="[${PROFILE}]" -v key="$1" '
    $0 == profile { in_section = 1; next }
    /^\[/         { in_section = 0 }
    in_section && $1 == key {
      sub(/^[^=]*=[[:space:]]*/, "")
      print
      exit
    }
  ' "${CREDS}"
}

VERDA_CLIENT_ID="$(read_key verda_client_id)"
VERDA_CLIENT_SECRET="$(read_key verda_client_secret)"
export VERDA_CLIENT_ID VERDA_CLIENT_SECRET

if [[ -z "${VERDA_CLIENT_ID}" || -z "${VERDA_CLIENT_SECRET}" ]]; then
  echo "Profile '${PROFILE}' in ${CREDS} is missing an id or secret." >&2
  exit 1
fi

exec tofu -chdir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" "$@"
