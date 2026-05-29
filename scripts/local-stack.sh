#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run/local-stack"
LOG_DIR="$ROOT_DIR/logs/local-stack"

EMAIL_PORT="${EMAIL_PORT:-8080}"
BACKEND_PORT="${BACKEND_PORT:-9000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

EMAIL_API_KEY="${EMAIL_API_KEY:-local-dev-email-api-key}"
EMAIL_SIGNING_SECRET="${EMAIL_SIGNING_SECRET:-local-dev-email-signing-secret}"
LOCAL_JWT_SECRET="${LOCAL_JWT_SECRET:-local-manual-test-jwt-secret-change-me}"
ALTCHA_HMAC_KEY="${ALTCHA_HMAC_KEY:-local-manual-test-altcha-secret}"

mkdir -p "$RUN_DIR" "$LOG_DIR"

pid_file() {
  echo "$RUN_DIR/$1.pid"
}

log_file() {
  echo "$LOG_DIR/$1.log"
}

is_running() {
  local file="$1"
  [[ -f "$file" ]] && kill -0 "$(cat "$file")" 2>/dev/null
}

port_running() {
  local port="$1"
  lsof -ti TCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

service_port() {
  case "$1" in
    email-service) echo "$EMAIL_PORT" ;;
    backend) echo "$BACKEND_PORT" ;;
    frontend) echo "$FRONTEND_PORT" ;;
  esac
}

stop_one() {
  local name="$1"
  local file
  file="$(pid_file "$name")"
  if is_running "$file"; then
    echo "Stopping $name (pid $(cat "$file"))"
    kill "$(cat "$file")" 2>/dev/null || true
    for _ in {1..20}; do
      if ! kill -0 "$(cat "$file")" 2>/dev/null; then
        break
      fi
      sleep 0.2
    done
    if kill -0 "$(cat "$file")" 2>/dev/null; then
      kill -9 "$(cat "$file")" 2>/dev/null || true
    fi
  fi
  rm -f "$file"
}

stop_ports() {
  for port in "$FRONTEND_PORT" "$BACKEND_PORT" "$EMAIL_PORT"; do
    local pids
    pids="$(lsof -ti TCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      echo "Stopping process(es) on port $port: $pids"
      kill $pids 2>/dev/null || true
      sleep 0.5
    fi
  done
}

wait_url() {
  local name="$1"
  local url="$2"
  for _ in {1..60}; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$name is ready: $url"
      return 0
    fi
    sleep 0.5
  done
  echo "$name did not become ready: $url"
  echo "Last $name logs:"
  tail -80 "$(log_file "$name")" 2>/dev/null || true
  return 1
}

check_backend_env() {
  (cd "$ROOT_DIR/backend" && node - <<'NODE'
require('dotenv').config();
const mongo = process.env.MONGO_URI || '';
if (!mongo || mongo.includes('ROTATE_AND_FILL')) {
  console.error('backend/.env MONGO_URI is missing or still a placeholder.');
  process.exit(1);
}
console.log(mongo.startsWith('mongodb+srv://') ? 'Using MongoDB SRV URI from backend/.env' : 'Using MongoDB URI from backend/.env');
NODE
  )
}

start_email() {
  echo "Starting email-service on :$EMAIL_PORT"
  (
    cd "$ROOT_DIR/email-service"
    setsid env \
      NODE_ENV=development \
      PORT="$EMAIL_PORT" \
      EMAIL_SERVICE_ENABLED=true \
      EMAIL_REQUIRE_API_KEY=true \
      EMAIL_REQUIRE_SIGNATURE=true \
      EMAIL_SERVICE_API_KEY="$EMAIL_API_KEY" \
      EMAIL_SERVICE_SIGNING_SECRET="$EMAIL_SIGNING_SECRET" \
      EMAIL_PROVIDER=brevo \
      EMAIL_FALLBACK_PROVIDERS= \
      SMTP_ENABLED=false \
      BREVO_ENABLED=true \
      EMAIL_DELIVERY_MODE=sync \
      EMAIL_QUEUE_ENABLED=false \
      SENDER_EMAIL="${SENDER_EMAIL:-onemoregift@protonmail.com}" \
      node src/server.js >"$(log_file email-service)" 2>&1 < /dev/null &
    echo $! >"$(pid_file email-service)"
  )
}

start_backend() {
  echo "Starting backend on :$BACKEND_PORT"
  (
    cd "$ROOT_DIR/backend"
    setsid env \
      PORT="$BACKEND_PORT" \
      JWT_SECRET="$LOCAL_JWT_SECRET" \
      CLIENT_URL="http://localhost:$FRONTEND_PORT" \
      SERVER_URL="http://localhost:$BACKEND_PORT" \
      CORS_ORIGIN="http://localhost:$FRONTEND_PORT,http://127.0.0.1:$FRONTEND_PORT" \
      EMAIL_SERVICE_URL="http://127.0.0.1:$EMAIL_PORT" \
      EMAIL_SERVICE_API_KEY="$EMAIL_API_KEY" \
      EMAIL_SERVICE_SIGNING_ENABLED=true \
      EMAIL_SERVICE_SIGNING_SECRET="$EMAIL_SIGNING_SECRET" \
      EMAIL_SERVICE_ENABLED=true \
      EMAIL_SERVICE_REQUIRED=false \
      COOKIE_DOMAIN= \
      node index.js >"$(log_file backend)" 2>&1 < /dev/null &
    echo $! >"$(pid_file backend)"
  )
}

start_frontend() {
  echo "Starting frontend on :$FRONTEND_PORT"
  (
    cd "$ROOT_DIR/frontend"
    rm -rf .next
    setsid env \
      PORT="$FRONTEND_PORT" \
      NEXT_PUBLIC_BASE_URL="http://localhost:$BACKEND_PORT/api/v1/" \
      NEXT_PUBLIC_API_URL="http://localhost:$BACKEND_PORT/api/v1" \
      NEXT_PUBLIC_ALTCHA_CHALLENGE_URL="http://localhost:$FRONTEND_PORT/api/altcha/challenge" \
      ALTCHA_HMAC_KEY="$ALTCHA_HMAC_KEY" \
      NEXT_PUBLIC_GOOGLE_CLIENT_ID="${NEXT_PUBLIC_GOOGLE_CLIENT_ID:-}" \
      node node_modules/next/dist/bin/next dev -p "$FRONTEND_PORT" >"$(log_file frontend)" 2>&1 < /dev/null &
    echo $! >"$(pid_file frontend)"
  )
}

start() {
  check_backend_env
  stop
  : >"$(log_file email-service)"
  : >"$(log_file backend)"
  : >"$(log_file frontend)"
  start_email
  wait_url email-service "http://127.0.0.1:$EMAIL_PORT/health"
  start_backend
  wait_url backend "http://127.0.0.1:$BACKEND_PORT/api/v1/health"
  start_frontend
  wait_url frontend "http://127.0.0.1:$FRONTEND_PORT"
  status
}

stop() {
  stop_one frontend
  stop_one backend
  stop_one email-service
  stop_ports
}

status() {
  for name in email-service backend frontend; do
    local file
    local port
    file="$(pid_file "$name")"
    port="$(service_port "$name")"
    if is_running "$file"; then
      echo "$name: running pid=$(cat "$file") log=$(log_file "$name")"
    elif port_running "$port"; then
      echo "$name: port $port is busy but pid file is stale log=$(log_file "$name")"
    else
      echo "$name: stopped log=$(log_file "$name")"
    fi
  done
  echo "Frontend:      http://localhost:$FRONTEND_PORT"
  echo "Backend API:   http://localhost:$BACKEND_PORT/api/v1"
  echo "Email service: http://localhost:$EMAIL_PORT"
}

health() {
  curl -fsS "http://127.0.0.1:$EMAIL_PORT/health"
  echo
  curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/v1/health"
  echo
  curl -fsSI "http://127.0.0.1:$FRONTEND_PORT" | head
}

logs() {
  local name="${1:-all}"
  if [[ "$name" == "all" ]]; then
    tail -n 120 "$(log_file email-service)" "$(log_file backend)" "$(log_file frontend)"
  else
    tail -n 160 "$(log_file "$name")"
  fi
}

follow() {
  local name="${1:-all}"
  if [[ "$name" == "all" ]]; then
    tail -f "$(log_file email-service)" "$(log_file backend)" "$(log_file frontend)"
  else
    tail -f "$(log_file "$name")"
  fi
}

case "${1:-}" in
  start) start ;;
  stop) stop ;;
  restart) stop; start ;;
  status) status ;;
  health) health ;;
  logs) logs "${2:-all}" ;;
  follow) follow "${2:-all}" ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|health|logs [service]|follow [service]}"
    exit 1
    ;;
esac
