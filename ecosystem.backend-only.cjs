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
