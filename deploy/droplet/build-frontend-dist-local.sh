#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
DIST_ROOT="$ROOT_DIR/dist/frontend-dist"
API_HOST="${API_HOST:-https://onemoregift.in}"

echo "[1/5] Installing frontend dependencies"
cd "$FRONTEND_DIR"
npm ci

echo "[2/5] Building frontend (standalone)"
NEXT_PUBLIC_BASE_URL="${API_HOST}/api/v1/" \
NEXT_PUBLIC_API_URL="${API_HOST}/api/v1" \
NEXT_PUBLIC_ALTCHA_CHALLENGE_URL="${API_HOST}/api/altcha/challenge" \
npm run build

echo "[3/5] Preparing dist folder"
rm -rf "$DIST_ROOT"
mkdir -p "$DIST_ROOT/standalone/.next" "$DIST_ROOT/standalone/public"

echo "[4/5] Copying build artifacts"
cp -R .next/standalone/. "$DIST_ROOT/standalone/"
cp -R .next/static/. "$DIST_ROOT/standalone/.next/static/"
cp -R public/. "$DIST_ROOT/standalone/public/"
if [[ -f .env.production ]]; then
  cp .env.production "$DIST_ROOT/standalone/.env.production"
fi

echo "[5/5] Writing deploy metadata"
cat > "$DIST_ROOT/README.txt" <<TXT
Upload this folder to droplet path:
/var/www/onemoregift-frontend-dist

PM2 entry:
- cwd: /var/www/onemoregift-frontend-dist/standalone
- script: server.js
- PORT=3000
TXT

echo "Frontend dist ready at: $DIST_ROOT"
