# OneMoreGift Deployment Guide

This setup deploys:

- `email-service` on Render.
- `backend` and `frontend` on one DigitalOcean Ubuntu droplet.
- MongoDB as an external database, preferably MongoDB Atlas or DigitalOcean Managed MongoDB.

The production domains used below are:

- Frontend: `https://onemoregift.in`
- Backend API: `https://api.onemoregift.in`
- Email service: `https://your-email-service.onrender.com`

## 1. Pre-flight Checks

Run these locally before deploying:

```bash
cd email-service && npm ci && npm test
cd ../backend && npm ci && npm test
cd ../frontend && npm ci && npm run build
```

The frontend build must know the production API URL. Use `frontend/.env.production` from `frontend/.env.production.example`.

## 2. Deploy Email Service to Render

Render can read the root `render.yaml`, which sets `rootDir: email-service` for this monorepo. You can also point Render's Blueprint Path at `email-service/render.yaml` if you prefer keeping the Blueprint file beside the service.

Use:

```text
Build command: npm ci
Start command: npm start
Health check path: /health
```

Set the secret values in Render:

```env
EMAIL_SERVICE_API_KEY=generate_a_long_random_secret
EMAIL_SERVICE_SIGNING_SECRET=generate_a_second_long_random_secret
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_brevo_smtp_login
SMTP_PASS=your_brevo_smtp_key
BREVO_API_KEY=optional_brevo_xkeysib_api_key
```

Brevo note: an SMTP key starts with `xsmtpsib` and belongs in `SMTP_PASS`. It is not the same as a Brevo API key, which usually starts with `xkeysib` and belongs in `BREVO_API_KEY`.

If Brevo shows "Unauthorized IP addresses are blocked for your SMTP keys", add your Render service's outbound IP address in Brevo under `Senders, domains, IPs`, or disable the SMTP authorized-IP restriction for this key. Do this after the Render service exists, because the IP comes from Render.

After deploy:

```bash
curl https://your-email-service.onrender.com/health
```

Keep `EMAIL_SERVICE_API_KEY` and `EMAIL_SERVICE_SIGNING_SECRET`; the backend needs the same values.

## 3. Prepare DigitalOcean Droplet

Create an Ubuntu droplet, add SSH key access, enable backups, and point DNS records to the droplet IP:

```text
A     onemoregift.in       DROPLET_IP
A     www.onemoregift.in   DROPLET_IP
A     api.onemoregift.in   DROPLET_IP
```

Install server packages:

```bash
sudo apt update
sudo apt install -y nginx git curl ufw
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Enable the firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 4. Upload Code and Configure Env

Clone the repository:

```bash
sudo mkdir -p /var/www
sudo chown -R "$USER:$USER" /var/www
git clone YOUR_GIT_REPO_URL /var/www/onemoregift
cd /var/www/onemoregift
```

Create production env files:

```bash
cp backend/.env.production.example backend/.env
cp frontend/.env.production.example frontend/.env.production
nano backend/.env
nano frontend/.env.production
```

Required backend values:

```env
NODE_ENV=production
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=long_random_secret
CLIENT_URL=https://onemoregift.in
SERVER_URL=https://api.onemoregift.in
CORS_ORIGIN=https://onemoregift.in,https://www.onemoregift.in
COOKIE_DOMAIN=.onemoregift.in
EMAIL_SERVICE_URL=https://your-email-service.onrender.com
EMAIL_SERVICE_API_KEY=same_as_render
EMAIL_SERVICE_SIGNING_SECRET=same_as_render
```

Do not paste a Brevo SMTP key into backend `BREVO_API_KEY`. The backend should call the Render email service; the Brevo SMTP key should live only in Render as `SMTP_PASS`.

Required frontend values:

```env
NEXT_PUBLIC_BASE_URL=https://api.onemoregift.in/api/v1/
NEXT_PUBLIC_API_URL=https://api.onemoregift.in/api/v1
NEXT_PUBLIC_ALTCHA_CHALLENGE_URL=https://onemoregift.in/api/altcha/challenge
ALTCHA_HMAC_KEY=long_random_secret
```

Install and build:

```bash
cd /var/www/onemoregift/backend
npm ci --omit=dev
mkdir -p public/uploads/images

cd /var/www/onemoregift/frontend
npm ci
npm run build
```

## 5. Start Apps with PM2

Copy the PM2 ecosystem file if needed and edit paths only if your app path is not `/var/www/onemoregift`.

```bash
cd /var/www/onemoregift
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs onemoregift-backend --lines 50
pm2 logs onemoregift-frontend --lines 50
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup`. PM2 will then restart both apps after server reboot.

## 6. Configure Nginx and HTTPS

Install the temporary HTTP config first:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo cp /var/www/onemoregift/deploy/nginx/onemoregift.http.conf /etc/nginx/sites-available/onemoregift
sudo ln -sf /etc/nginx/sites-available/onemoregift /etc/nginx/sites-enabled/onemoregift
sudo nginx -t
sudo systemctl reload nginx
```

Then get certificates:

```bash
sudo certbot --nginx -d onemoregift.in -d www.onemoregift.in
sudo certbot --nginx -d api.onemoregift.in
```

Finally install the production HTTPS config:

```bash
sudo cp /var/www/onemoregift/deploy/nginx/onemoregift.conf /etc/nginx/sites-available/onemoregift
sudo ln -sf /etc/nginx/sites-available/onemoregift /etc/nginx/sites-enabled/onemoregift
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Create Root Admin

On the droplet:

```bash
cd /var/www/onemoregift/backend
node setup-root-admin.js
```

Then sign in at:

```text
https://onemoregift.in/admin
```

## 8. Verify Production

Basic checks:

```bash
curl https://api.onemoregift.in/api/v1/health
curl https://your-email-service.onrender.com/health
curl -I https://onemoregift.in
```

Or run:

```bash
cd /var/www/onemoregift
chmod +x deploy/verify-production.sh
EMAIL_URL=https://your-email-service.onrender.com ./deploy/verify-production.sh
```

Manual smoke test:

- Register a user.
- Confirm OTP email arrives.
- Log in.
- Open giveaway pages.
- Log in as admin.
- Create a giveaway with an uploaded image.
- Confirm the image URL starts with `https://api.onemoregift.in/uploads/images/`.

## 9. Deploy Updates

```bash
cd /var/www/onemoregift
git pull

cd backend
npm ci --omit=dev

cd ../frontend
npm ci
npm run build

cd ..
pm2 restart ecosystem.config.cjs
pm2 save
```

Run verification again after every update.

## 10. Operational Notes

- Keep `.env`, `.env.production`, API keys, MongoDB URI, and SMTP credentials out of git.
- Back up MongoDB separately from the droplet.
- Back up `backend/public/uploads/images` if uploaded giveaway images matter.
- If email delivery fails, check Render logs first, then backend logs.
- If frontend requests fail, check `NEXT_PUBLIC_BASE_URL`, backend `CORS_ORIGIN`, and Nginx routing for `api.onemoregift.in`.

## References

- Render Blueprint supports `buildCommand`, `startCommand`, and `healthCheckPath`: https://render.com/docs/blueprint-spec
- Render health checks expect a successful HTTP response from the configured path: https://render.com/docs/health-checks
- DigitalOcean recommends SSH keys, firewalls, backups, and monitoring for production droplets: https://docs.digitalocean.com/products/droplets/getting-started/recommended-droplet-setup/
- DigitalOcean documents Let's Encrypt certificates for droplets: https://docs.digitalocean.com/support/how-do-i-install-an-ssl-certificate-on-a-droplet/
- Next.js supports self-hosting with `next start`: https://nextjs.org/docs/app/guides/self-hosting
- PM2 ecosystem files and startup persistence: https://pm2.keymetrics.io/docs/usage/application-declaration/ and https://pm2.keymetrics.io/docs/usage/startup/
