#!/usr/bin/env bash
set -euo pipefail

rexios_root="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
rexios_env="${REXIOS_ENV_FILE:-$rexios_root/.env.vps}"

if [[ ! -f "$rexios_env" ]]; then
  printf '%s\n' 'Missing .env.vps. Follow docs/VPS.md before running this command.' >&2
  exit 1
fi

# Explicit project, environment and file keep local/demo/other VPS stacks separate.
exec docker compose --project-name rexios-vps \
  --env-file "$rexios_env" --project-directory "$rexios_root" \
  --file "$rexios_root/compose.vps.yml" "$@"
