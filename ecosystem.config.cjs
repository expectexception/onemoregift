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
