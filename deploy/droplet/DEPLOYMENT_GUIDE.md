# OneMoreGift Deployment Guide

This guide details the system architecture, environment configurations, and deployment procedures for the OneMoreGift platform on DigitalOcean.

---

## ── System Architecture ─────────────────────────────────────────────────────────

The platform consists of two main parts:
1. **Frontend**: A Next.js application built in standalone mode, running on port `3000` via PM2.
2. **Backend**: An Express.js backend running on port `9000` via PM2.
3. **Database**: MongoDB (external cloud database).
4. **Nginx**: Serving as a reverse proxy, SSL termination via Certbot, and routing `/api/`, `/uploads/`, and `/media/` requests to the backend.

---

## ── Environment Configurations & Encryption ─────────────────────────────────────

To keep sensitive configuration details secure, we use a secure environment key decryption system.

### 1. File Structure
- `backend/.env.enc`: The encrypted version of your `.env` file containing all production credentials. This file is safe to commit to Git.
- `backend/.env.example`: A template showing the required variables.

### 2. Encryption Keys
- **Master Encryption Key**: Used by the backend to decrypt `.env.enc` in memory at startup.
- **To encrypt a new `.env` file**:
  ```bash
  node backend/scripts/env-encrypt.js <your-master-key>
  ```
- **To decrypt `.env.enc` back to a readable `.env`**:
  ```bash
  node backend/scripts/env-decrypt.js <your-master-key>
  ```

### 3. Required Environment Variables
Ensure these are configured in your plain `.env` before encrypting:
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: Token signature key.
- `SERVER_URL`: Public base URL of backend.
- `OTP_VERIFICATION_ENABLED`: `true` or `false` to enable/disable OTP checks.
- `ADMIN_ALLOWED_EMAILS`: Comma-separated list of emails allowed to log in as admin.

---

## ── PM2 Process Management ───────────────────────────────────────────────────

On the droplet, PM2 manages the Node processes. The environment variables and paths are defined inside:
- `ecosystem.backend-only.config.cjs`

### View active processes:
```bash
pm2 status
```

### Restart a specific app:
```bash
pm2 restart onemoregift-backend
pm2 restart onemoregift-frontend-dist
```

### View real-time logs:
```bash
pm2 logs
```

---

## ── Deployment Scripts ────────────────────────────────────────────────────────

All scripts are located in `deploy/droplet/` and should be executed from the root of the local workspace.

### 1. Full Deploy (Backend + Frontend)
Rebuilds the frontend, synchronizes the entire repository, resets droplet state, and restarts all PM2 processes.
```bash
bash deploy/droplet/deploy-on-droplet.sh [droplet-ssh-host]
```
*(Default host: `root@139.59.27.178`)*

### 2. Backend-only Deploy
Pulls the latest git changes to the backend on the droplet and restarts the backend process without rebuilding the frontend.
```bash
ssh root@139.59.27.178 "cd /var/www/onemoregift && git pull && bash deploy/droplet/deploy-backend-only-on-droplet.sh"
```

### 3. Frontend-only Deploy (FAST)
Builds the Next.js frontend standalone bundle locally, uploads the production dist directory to the droplet, and restarts the PM2 frontend process.
```bash
bash deploy/droplet/deploy-frontend-only.sh [droplet-ssh-host]
```
*(Default host: `root@139.59.27.178`)*

---

## ── Troubleshooting ───────────────────────────────────────────────────────────

### Stale Images / 404 on Uploads
1. **Corporate Resource Policy**: Backend automatically sends `Cross-Origin-Resource-Policy: cross-origin` headers.
2. **Missing Directories**: The `backend/media` directory has been added to `.gitignore` to prevent `git clean` from deleting user-uploaded giveaway images. Do not remove this exclusion.
3. **Nginx Cache**: If a resource fails to load during deployment, clear your browser cache or run a hard reload (`Ctrl + Shift + R`).
