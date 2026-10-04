#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# OneMoreGift · build a deployable release tarball (runs locally or in CI)
#
# DreamHost shared hosting can't build Next.js (the build peaks ~1.3 GB and the
# process monitor kills it), so everything is built here and the server only
# unpacks and runs it. Builds from the committed HEAD, never the working tree.
#
#     bash deploy/dreamhost/shared/build-release.sh            # → dist/release/
#
# Env (optional):
#   PUBLIC_ORIGIN       Public site origin baked into the FE   (https://onemoregift.in)
#   BACKEND_PORT        Port the API listens on, on the server (41891)
#   FRONTEND_PORT       Port Next.js listens on, on the server (41892)
#   FRONTEND_BUILD_ENV  Path to a .env file with NEXT_PUBLIC_* build values
#                       (e.g. Google client id). Explicit env vars still win.
#   OUT_DIR             Where to write the tarball             (dist/release)
# ─────────────────────────────────────────────────────────────────────────────

PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://onemoregift.in}"
BACKEND_PORT="${BACKEND_PORT:-41891}"
FRONTEND_PORT="${FRONTEND_PORT:-41892}"
REPO_ROOT="$(git rev-parse --show-toplevel)"
OUT_DIR="${OUT_DIR:-$REPO_ROOT/dist/release}"
SHA="$(git -C "$REPO_ROOT" rev-parse --short HEAD)"
RELEASE_ID="$(date -u +%Y%m%d%H%M%S)-$SHA"

log() { printf '\n\033[1;36m[build]\033[0m %s\n' "$*"; }
die() { printf '\n\033[1;31m[build] ERROR:\033[0m %s\n' "$*" >&2; exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
SRC="$WORK/src"; REL="$WORK/onemoregift-$RELEASE_ID"
mkdir -p "$SRC" "$REL" "$OUT_DIR"

log "Export HEAD ($SHA) to a clean tree"
git -C "$REPO_ROOT" archive HEAD | tar -x -C "$SRC"

log "Backend: production dependencies"
( cd "$SRC/backend" && npm ci --omit=dev --no-audit --no-fund )

log "Frontend: install + build (API → 127.0.0.1:$BACKEND_PORT)"
if [ -n "${FRONTEND_BUILD_ENV:-}" ]; then
  [ -f "$FRONTEND_BUILD_ENV" ] || die "FRONTEND_BUILD_ENV '$FRONTEND_BUILD_ENV' not found"
  cp "$FRONTEND_BUILD_ENV" "$SRC/frontend/.env.production"
fi
(
  cd "$SRC/frontend"
  npm ci --no-audit --no-fund
  NODE_ENV=production \
  NEXT_PUBLIC_BASE_URL="$PUBLIC_ORIGIN/api/v1/" \
  NEXT_PUBLIC_API_URL="$PUBLIC_ORIGIN/api/v1" \
  NEXT_PUBLIC_ALTCHA_CHALLENGE_URL="$PUBLIC_ORIGIN/api/altcha/challenge" \
  BACKEND_INTERNAL_URL="http://127.0.0.1:$BACKEND_PORT" \
  npm run build
)
[ -f "$SRC/frontend/.next/standalone/server.js" ] || die "Next standalone server.js missing (is output: 'standalone' set?)"

log "Assemble release $RELEASE_ID"
cp -R "$SRC/backend" "$REL/backend"
rm -rf "$REL/backend/test" "$REL/backend/public/uploads"
cp -R "$SRC/frontend/.next/standalone" "$REL/frontend"
cp -R "$SRC/frontend/.next/static" "$REL/frontend/.next/static"
cp -R "$SRC/frontend/public" "$REL/frontend/public"
# Secrets never ship in the tarball; the server links its own env files in.
find "$REL" -maxdepth 3 -name '.env*' ! -name '*.example' -delete
cp -R "$SRC/deploy/dreamhost/shared/server" "$REL/bin"
cp "$SRC/deploy/dreamhost/shared/htaccess" "$REL/htaccess"
chmod +x "$REL/bin/"*
cat > "$REL/RELEASE" <<EOF
RELEASE_ID=$RELEASE_ID
GIT_SHA=$SHA
BACKEND_PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT
PUBLIC_ORIGIN=$PUBLIC_ORIGIN
EOF

TARBALL="$OUT_DIR/onemoregift-$RELEASE_ID.tar.gz"
tar -C "$WORK" -czf "$TARBALL" "onemoregift-$RELEASE_ID"
log "Wrote $TARBALL ($(du -h "$TARBALL" | cut -f1))"
echo "$TARBALL" > "$OUT_DIR/LATEST"
