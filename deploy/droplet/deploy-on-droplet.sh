#!/usr/bin/env bash
set -euo pipefail

# One-command deploy script to run directly on the droplet.
# Usage:
#   bash deploy/droplet/deploy-on-droplet.sh
# Optional:
#   BRANCH=main bash deploy/droplet/deploy-on-droplet.sh
#   APP_DIR=/var/www/onemoregift bash deploy/droplet/deploy-on-droplet.sh

APP_DIR="${APP_DIR:-/var/www/onemoregift}"
BRANCH="${BRANCH:-main}"

echo "[1/8] Entering app directory: $APP_DIR"
cd "$APP_DIR"

echo "[2/8] Syncing latest code from origin/$BRANCH"
git fetch --all --prune
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "[3/8] Installing backend dependencies"
cd "$APP_DIR/backend"
npm ci --omit=dev
mkdir -p public/uploads/images

echo "[4/8] Installing frontend dependencies"
cd "$APP_DIR/frontend"
npm install

echo "[5/8] Building frontend"
npm run build

echo "[6/8] Restarting app services with PM2"
cd "$APP_DIR"
pm2 delete all || true
pm2 start ecosystem.config.cjs
pm2 save

echo "[7/8] Configuring Nginx IP fallback"
cat >/etc/nginx/sites-available/onemoregift-ip.conf <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    client_max_body_size 20M;

    gzip on;
    gzip_comp_level 5;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript application/xml+rss image/svg+xml;

    location /api/ {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /media/ {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/onemoregift-ip.conf /etc/nginx/sites-enabled/onemoregift-ip.conf
nginx -t
systemctl reload nginx

echo "[8/8] Verifying deployment"
pm2 status
echo "Frontend:"
curl -I --max-time 10 http://127.0.0.1:3000 || true
echo "Backend health:"
curl --max-time 10 http://127.0.0.1:9000/api/v1/health || true
echo "Nginx on droplet IP:"
curl -I --max-time 10 http://127.0.0.1 || true

echo
echo "Deploy finished."
