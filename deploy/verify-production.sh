#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-https://onemoregift.in}"
API_URL="${API_URL:-https://api.onemoregift.in}"
EMAIL_URL="${EMAIL_URL:-}"

echo "Checking frontend: ${APP_URL}"
curl --fail --silent --show-error --head "${APP_URL}" >/dev/null

echo "Checking backend: ${API_URL}/api/v1/health"
curl --fail --silent --show-error "${API_URL}/api/v1/health" | node -e '
let raw = "";
process.stdin.on("data", chunk => raw += chunk);
process.stdin.on("end", () => {
  const data = JSON.parse(raw);
  if (data.error || data.status !== "ok") {
    console.error(raw);
    process.exit(1);
  }
  console.log(`backend ok, db=${data.db}`);
});
'

if [[ -n "${EMAIL_URL}" ]]; then
  echo "Checking email service: ${EMAIL_URL}/health"
  curl --fail --silent --show-error "${EMAIL_URL%/}/health" | node -e '
let raw = "";
process.stdin.on("data", chunk => raw += chunk);
process.stdin.on("end", () => {
  const data = JSON.parse(raw);
  if (data.error || data.status !== "ok") {
    console.error(raw);
    process.exit(1);
  }
  console.log(`email ok, provider=${data.provider}, deliveryMode=${data.deliveryMode}`);
});
'
else
  echo "Skipping email service check. Set EMAIL_URL=https://your-service.onrender.com to include it."
fi

echo "Production checks passed."
