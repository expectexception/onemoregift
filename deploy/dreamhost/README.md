# CI/CD: push `production` → auto-deploy to DreamHost

> **Production currently runs on DreamHost shared hosting:** see
> [`shared/README.md`](./shared/README.md). This file covers the Managed VPS +
> PM2 setup, for if the plan is upgraded.

Pushing to the **`production`** branch runs
[`.github/workflows/deploy-production.yml`](../../.github/workflows/deploy-production.yml):

1. **CI gate** — backend `npm test` and frontend `npm run build`. If either fails,
   nothing is deployed.
2. **Deploy** — GitHub SSHes into the DreamHost server and runs
   [`deploy/dreamhost/deploy.sh`](./deploy.sh): pull `production`, install backend
   deps, build the frontend, and restart the app(s).

Until the SSH secrets are set, the deploy step **skips with a warning** instead of
failing — so creating the branch doesn't show a red build.

---

## One-time setup

### 1. Enable SSH + a shell user on DreamHost
You said SSH already works. Confirm you can log in:
```bash
ssh <shelluser>@<yourserver>    # e.g. ssh omg@ps123456.dreamhostps.com
```

### 2. Create a deploy SSH key (no passphrase) for GitHub → server
On your laptop:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/omg_deploy -N "" -C "github-actions-deploy"
ssh-copy-id -i ~/.ssh/omg_deploy.pub <shelluser>@<yourserver>
# test it
ssh -i ~/.ssh/omg_deploy <shelluser>@<yourserver> "echo ok"
```

### 3. Clone the repo on the server (the deploy checkout)
```bash
ssh <shelluser>@<yourserver>
git clone git@github.com:expectexception/onemoregift.git ~/onemoregift
cd ~/onemoregift && git checkout production
```
> If the server can't use SSH to GitHub, clone over HTTPS with a read-only token,
> or use a GitHub deploy key. The deploy script only needs `git fetch`/`reset`.

### 4. Put the production env files on the server (never in git)
```bash
# backend: FIELD_ENCRYPTION_KEY must match the key the live database was written with
cp ~/onemoregift/backend/.env.production.example ~/onemoregift/backend/.env
$EDITOR ~/onemoregift/backend/.env         # real MONGO_URI, JWT_SECRET, keys, etc.
# frontend
cp ~/onemoregift/frontend/.env.production.example ~/onemoregift/frontend/.env.production
$EDITOR ~/onemoregift/frontend/.env.production
```

### 5. Node hosting on DreamHost: Managed VPS + PM2

DreamHost **shared hosting cannot run Node.js**, and Passenger does not work
with Node 14+. This app needs a **Managed VPS with at least 2 GB RAM**: the
Next.js build alone peaks around 1.3 GB.

On the VPS, as the shell user:
```bash
# Node via nvm (DreamHost's documented route), then PM2
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
. ~/.nvm/nvm.sh && nvm install 20 && npm i -g pm2
```

PM2 runs the backend on **9000** and Next.js on **8000** (`deploy.sh` sets
`FRONTEND_PORT=8000`; the Proxy Server only forwards to ports 8000-65535). In
the panel, **Servers → VPS → Proxy Server**, add **one** proxy: domain
`onemoregift.in`, path left **blank**, port **8000**.

Next.js then forwards `/api/v1`, `/uploads` and `/media` to the backend on
`127.0.0.1:9000` (`deploy.sh` builds with `BACKEND_INTERNAL_URL`), and serves
everything else itself, including its own `/api/altcha/*` and `/api/proxy/*`.
Client IPs survive the hop, so the backend's rate limits still work per user.

Keep PM2 alive across reboots with DreamHost's *linger* setup (systemd user
service), then `pm2 save` after the first deploy.

### 6. Add GitHub secrets and variables
Repo → **Settings → Secrets and variables → Actions**.

**Secrets:**
| Name | Value |
|------|-------|
| `SSH_HOST` | your DreamHost server hostname |
| `SSH_USER` | your shell user |
| `SSH_KEY` | contents of `~/.ssh/omg_deploy` (the **private** key, full text) |
| `SSH_PORT` | `22` (only if non-default) |
| `APP_DIR` | `/home/<user>/onemoregift` (repo checkout from step 3) |

**Variables:**
| Name | Value |
|------|-------|
| `RESTART_MODE` | `pm2` (default; leave unset) |
| `API_HOST` | `https://onemoregift.in` (public API origin baked into the FE build) |
| `NEXT_PUBLIC_BASE_URL` | `https://onemoregift.in/api/v1/` |
| `NEXT_PUBLIC_API_URL` | `https://onemoregift.in/api/v1` |
| `NEXT_PUBLIC_ALTCHA_CHALLENGE_URL` | `https://onemoregift.in/api/altcha/challenge` |
| `HEALTHCHECK_URL` | `https://onemoregift.in/api/v1/health` (optional post-deploy check) |

### 7. Deploy
```bash
git checkout production
git merge <your-release-branch>   # or push commits directly
git push origin production
```
Watch it under the repo's **Actions** tab. To run without pushing, use
**Actions → Deploy production → DreamHost → Run workflow**.

---

## Notes / tuning
- **Rollback:** `ssh <user>@<host> "cd ~/onemoregift && git reset --hard <good-sha> && DEPLOY_BRANCH=production bash deploy/dreamhost/deploy.sh"` (or re-run the workflow on an older commit).
- **Skip the frontend build** on a deploy (e.g. backend-only change): run the script with `SKIP_BUILD=1`.
- **Build in CI instead of on the server** (for low-memory shared plans): the CI job
  already builds the frontend; extend the deploy job to `rsync` `frontend/.next/standalone`
  to `FRONTEND_APP_DIR` and set `SKIP_BUILD=1`. Ask and I'll wire this variant up.
- The **email-service** stays on Render and is not part of this pipeline.
