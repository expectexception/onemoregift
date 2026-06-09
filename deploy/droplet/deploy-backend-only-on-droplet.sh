#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/onemoregift}"
BRANCH="${BRANCH:-main}"
FRONTEND_DIST_DIR="${FRONTEND_DIST_DIR:-/var/www/onemoregift-frontend-dist}"

echo "[1/6] Sync backend repo"
cd "$APP_DIR"
git fetch --all --prune
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "[2/6] Install backend deps"
cd "$APP_DIR/backend"
npm ci --omit=dev
mkdir -p public/uploads/images

echo "[3/6] Ensure frontend dist exists"
if [[ ! -f "$FRONTEND_DIST_DIR/standalone/server.js" ]]; then
  echo "Frontend dist not found at $FRONTEND_DIST_DIR/standalone/server.js"
  echo "Upload it first using deploy/droplet/upload-frontend-dist.sh"
  exit 1
fi

echo "[4/6] Start PM2 apps (backend + frontend dist)"
cd "$APP_DIR"
pm2 delete all || true
pm2 start ecosystem.backend-only.config.cjs
pm2 save

echo "[5/6] Configure nginx"
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

echo "[6/6] Health checks"
pm2 status
curl -I --max-time 10 http://127.0.0.1:3000 || true
curl --max-time 10 http://127.0.0.1:9000/api/v1/health || true
curl -I --max-time 10 http://127.0.0.1 || true

echo "Backend-only deploy complete."
