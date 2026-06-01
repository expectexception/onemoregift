#!/usr/bin/env bash
set -euo pipefail

DROPLET_HOST="${1:-root@139.59.27.178}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DIST_ROOT="$ROOT_DIR/dist/frontend-dist"
TARGET_DIR="/var/www/onemoregift-frontend-dist"

if [[ ! -f "$DIST_ROOT/standalone/server.js" ]]; then
  echo "Missing dist build. Run: bash deploy/droplet/build-frontend-dist-local.sh"
  exit 1
fi

echo "Uploading frontend dist to $DROPLET_HOST:$TARGET_DIR"
ssh "$DROPLET_HOST" "mkdir -p $TARGET_DIR"
rsync -az --delete "$DIST_ROOT/" "$DROPLET_HOST:$TARGET_DIR/"

echo "Upload complete."
