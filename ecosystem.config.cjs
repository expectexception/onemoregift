const path = require("path");

// Paths resolve from this file, so the same config works wherever the repo is
// checked out (/var/www on the droplet, ~/onemoregift on DreamHost).
// DreamHost's Proxy Server only forwards to ports 8000-65535, so deploy.sh sets
// FRONTEND_PORT=8000 there; the droplet's nginx still expects 3000.
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

module.exports = {
  apps: [
    {
      name: "onemoregift-backend",
      cwd: path.join(__dirname, "backend"),
      script: "index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 9000,
        // APP_MASTER_KEY: "PASTE_YOUR_64_CHAR_HEX_MASTER_KEY_HERE",
        // ↑ Uncomment and fill in after running: node scripts/gen-keys.js
        // Then encrypt your .env: node scripts/env-encrypt.js --key <key> --input .env --output .env.enc
        // This key decrypts .env.enc at startup. Keep it safe — never commit it.
      },
    },
    {
      name: "onemoregift-frontend",
      cwd: path.join(__dirname, "frontend"),
      script: "node_modules/next/dist/bin/next",
      args: `start -p ${FRONTEND_PORT}`,
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "768M",
      env: {
        NODE_ENV: "production",
        PORT: FRONTEND_PORT,
      },
    },
  ],
};
