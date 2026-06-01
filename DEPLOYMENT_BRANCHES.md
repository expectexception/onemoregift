# Branch Deployment Workflow

This repository uses three deployment branches:

- `main`: full source of truth (frontend + backend + email-service).
- `droplet`: deploy backend + frontend to DigitalOcean Droplet.
- `render-email-service`: deploy only `email-service` to Render Blueprint.

## 1) Main Branch

`main` should always contain complete app code and latest stable changes.

## 2) Droplet Branch

Use this branch when preparing/releasing backend + frontend to Ubuntu droplet.

Commands:

```bash
git checkout -b droplet
./deploy/droplet/setup-droplet.sh
```

What this branch expects:

- `backend/.env` configured for production.
- `frontend/.env.production` configured for production.
- Nginx config from `deploy/nginx/` installed on server.

## 3) Render Email Service Branch

Use this branch when deploying `email-service` to Render.

Commands:

```bash
git checkout -b render-email-service
cd email-service
./scripts/render-exec.sh check
```

Render Blueprint path:

- `email-service/render-blueprint.yaml`

Recommended Render commands:

- Build command: `npm ci`
- Start command: `npm start`
- Health path: `/health`

## 4) Suggested Publish Flow

```bash
git checkout main
git push origin main

git checkout droplet
git push origin droplet

git checkout render-email-service
git push origin render-email-service
```
