#!/usr/bin/env bash
set -euo pipefail

# OneMoreGift droplet bootstrap for Ubuntu 22.04/24.04.
# Installs runtime dependencies, builds backend/frontend, configures PM2 + Nginx.

APP_DIR="${APP_DIR:-/var/www/onemoregift}"
APP_USER="${APP_USER:-$USER}"
NODE_MAJOR="${NODE_MAJOR:-22}"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1"
    exit 1
  }
}

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "Expected repo at $APP_DIR, but .git is missing."
  echo "Clone your repository there first, then rerun this script."
  exit 1
fi

echo "[1/7] Installing OS packages"
sudo apt update
sudo apt install -y nginx git curl ufw ca-certificates gnupg

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_MAJOR" ]]; then
  echo "[2/7] Installing Node.js $NODE_MAJOR"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[3/7] Installing PM2"
  sudo npm install -g pm2
fi

echo "[4/7] Preparing app permissions"
sudo mkdir -p /var/www
sudo chown -R "$APP_USER:$APP_USER" /var/www
mkdir -p "$BACKEND_DIR/public/uploads/images"

echo "[5/7] Installing app dependencies"
( cd "$BACKEND_DIR" && npm ci --omit=dev )
( cd "$FRONTEND_DIR" && npm ci )

echo "[6/7] Building frontend"
( cd "$FRONTEND_DIR" && npm run build )

echo "[7/7] Starting services via PM2"
( cd "$APP_DIR" && pm2 start ecosystem.config.cjs )
pm2 save

# PM2 startup command (safe to re-run)
PM2_STARTUP_CMD="$(pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" | tail -n 1 || true)"
if [[ -n "$PM2_STARTUP_CMD" ]]; then
  echo "Run this command once with sudo to enable PM2 on reboot:"
  echo "$PM2_STARTUP_CMD"
fi

# Basic firewall defaults.
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

echo
echo "Droplet bootstrap complete."
echo "Next steps:"
echo "1) Fill backend/.env and frontend/.env.production"
echo "2) Copy deploy/nginx/onemoregift.http.conf to /etc/nginx/sites-available/onemoregift"
echo "3) Enable site, run certbot, then switch to deploy/nginx/onemoregift.conf"
