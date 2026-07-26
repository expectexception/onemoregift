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
        APP_MASTER_KEY: "05009b0aadc9bb8af82aaca45b6614b815277967b4cf20cac133b24da63225a5",
      },
    },
    {
      name: "onemoregift-frontend-dist",
      cwd: "/var/www/onemoregift-frontend-dist/standalone",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
