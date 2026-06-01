# Backend-Only Droplet Deploy (Frontend Built Locally)

This mode avoids frontend build on droplet.

## 1) Local machine: build frontend dist

```bash
bash deploy/droplet/build-frontend-dist-local.sh
```

## 2) Local machine: upload frontend dist to droplet

```bash
bash deploy/droplet/upload-frontend-dist.sh root@139.59.27.178
```

## 3) Droplet: deploy backend + run uploaded frontend dist

```bash
cd /var/www/onemoregift
bash deploy/droplet/deploy-backend-only-on-droplet.sh
```

## Notes

- Backend runs from repo at `/var/www/onemoregift/backend`.
- Frontend runtime runs from uploaded artifact at `/var/www/onemoregift-frontend-dist/standalone`.
- PM2 config used: `ecosystem.backend-only.cjs`.
