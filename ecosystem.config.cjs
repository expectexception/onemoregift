module.exports = {
  apps: [
    {
      name: "onemoregift-backend",
      cwd: "/var/www/onemoregift/backend",
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
      cwd: "/var/www/onemoregift/frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "768M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
