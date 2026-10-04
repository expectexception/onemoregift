#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# OneMoreGift · deploy to DreamHost shared hosting (runs locally or in CI)
#
#     bash deploy/dreamhost/shared/deploy.sh               # build + ship HEAD
#     TARBALL=dist/release/x.tar.gz bash deploy/...        # ship a prebuilt one
#
# Env:
#   SSH_TARGET   ssh destination (an ~/.ssh/config alias works)  (dreamhost)
#   SSH_OPTS     extra ssh/scp options, e.g. "-i key -o UserKnownHostsFile=f"
#   TARBALL      skip the build and ship this tarball
#   + everything build-release.sh reads (PUBLIC_ORIGIN, ports, ...)
# ─────────────────────────────────────────────────────────────────────────────

SSH_TARGET="${SSH_TARGET:-dreamhost}"
SSH_OPTS="${SSH_OPTS:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"

log() { printf '\n\033[1;35m[deploy]\033[0m %s\n' "$*"; }

if [ -z "${TARBALL:-}" ]; then
  bash "$HERE/build-release.sh"
  TARBALL="$(cat "$(git rev-parse --show-toplevel)/dist/release/LATEST")"
fi
NAME="$(basename "$TARBALL" .tar.gz)"

log "Upload $NAME to $SSH_TARGET"
# shellcheck disable=SC2086
ssh $SSH_OPTS "$SSH_TARGET" 'mkdir -p ~/onemoregift/releases ~/onemoregift/incoming'
# shellcheck disable=SC2086
scp $SSH_OPTS "$TARBALL" "$SSH_TARGET:onemoregift/incoming/$NAME.tar.gz"

log "Activate on server"
# shellcheck disable=SC2086
ssh $SSH_OPTS "$SSH_TARGET" "NAME='$NAME' bash -s" <<'REMOTE'
set -euo pipefail
cd ~/onemoregift

# Runs on DreamHost's system Node 18 (see NODE_BIN in server/omg for why).
node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>18||(a===18&&b>=18)?0:1)' \
  || { echo "[server] need Node >= 18.18, found $(node -v)"; exit 1; }
echo "[server] node $(node -v)"

tar -xzf "incoming/$NAME.tar.gz" -C releases
rm -f "incoming/$NAME.tar.gz"
"releases/$NAME/bin/omg" activate "releases/$NAME"

# Bring the apps back whenever DreamHost's process monitor kills them.
line='*/5 * * * * $HOME/onemoregift/current/bin/omg ensure >> $HOME/onemoregift/logs/ensure.log 2>&1'
if ! crontab -l 2>/dev/null | grep -qF 'onemoregift/current/bin/omg ensure'; then
  ( crontab -l 2>/dev/null; echo "$line" ) | crontab -
  echo "[server] cron keepalive installed"
fi
~/onemoregift/current/bin/omg status
REMOTE

log "Deployed $NAME"
