#!/usr/bin/env bash
set -euo pipefail

# This script builds the frontend locally, uploads it to the droplet, and restarts the PM2 frontend process.
DROPLET_HOST="${1:-root@139.59.27.178}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "=== [1/3] Building frontend locally ==="
bash "$ROOT_DIR/deploy/droplet/build-frontend-dist-local.sh"

echo "=== [2/3] Uploading frontend dist to droplet ==="
bash "$ROOT_DIR/deploy/droplet/upload-frontend-dist.sh" "$DROPLET_HOST"

echo "=== [3/3] Restarting PM2 frontend process on droplet ==="
ssh "$DROPLET_HOST" "pm2 restart onemoregift-frontend-dist"

echo "=== Frontend deployment successfully complete! ==="
