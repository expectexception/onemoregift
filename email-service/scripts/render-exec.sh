#!/usr/bin/env bash
set -euo pipefail

# Render execution helper for email-service.
# Usage:
#   ./scripts/render-exec.sh check
#   ./scripts/render-exec.sh build
#   ./scripts/render-exec.sh start

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mode="${1:-check}"

required_env=(
  EMAIL_SERVICE_API_KEY
  EMAIL_SERVICE_SIGNING_SECRET
)

check_env() {
  local missing=0
  for key in "${required_env[@]}"; do
    if [[ -z "${!key:-}" ]]; then
      echo "Missing env: $key"
      missing=1
    fi
  done

  if [[ "$missing" -ne 0 ]]; then
    echo "Environment validation failed."
    return 1
  fi

  echo "Required env looks good."
}

case "$mode" in
  check)
    npm ci
    npm test
    check_env
    ;;
  build)
    npm ci
    ;;
  start)
    npm start
    ;;
  *)
    echo "Unknown mode: $mode"
    echo "Use one of: check | build | start"
    exit 1
    ;;
esac
