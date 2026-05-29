# OneMoreGift Email Service

Small standalone email gateway designed to run on Render while the main app runs on a DigitalOcean droplet.

The main backend calls this service over HTTPS. This avoids DigitalOcean SMTP/network restrictions and keeps email provider credentials out of the main app server.

## Features

- Server-to-server API key authentication plus HMAC signed request tokens
- Generic SMTP delivery
- Brevo transactional email fallback
- Branded OTP, reset-password, welcome, notification, winner, and custom HTML messages
- Theme overrides per request, so the same service can support other apps
- Health endpoint for Render
- Request validation with clear errors
- In-process delivery queue with concurrency, retries, and job status endpoints
- Bulk email endpoint for multiple messages
- Env switches for disabling routes, providers, queue mode, API-key auth, and rate limiting
- Rate limiting and security headers

## Endpoints

`GET /health`

Returns service health.

`POST /v1/email/send`

Headers:

```http
x-api-key: YOUR_EMAIL_SERVICE_API_KEY
x-email-timestamp: 1710000000
x-email-nonce: RANDOM_NONCE
x-email-signature: HMAC_SHA256_SIGNATURE
```

Body:

```json
{
  "to": "user@example.com",
  "subject": "Welcome to OneMoreGift",
  "template": "welcome",
  "data": {
    "message": "Your account is ready."
  }
}
```

Response in queue mode:

```json
{
  "error": false,
  "status": "queued",
  "jobId": "4dd2d5f1-1ad1-4dc0-a791-8edc898bd578"
}
```

`POST /v1/email/bulk`

Queues or sends multiple independent messages.

```json
{
  "messages": [
    {
      "to": "one@example.com",
      "subject": "Welcome",
      "template": "welcome",
      "data": { "message": "Your account is ready." }
    },
    {
      "to": "two@example.com",
      "subject": "Security notice",
      "template": "notification",
      "data": { "message": "Your password was changed." }
    }
  ]
}
```

Supported templates:

- `otp`
- `reset-password`
- `welcome`
- `notification`
- `winner`
- `custom`

`GET /v1/templates`

Returns the supported template names and the default brand settings currently loaded from env.

`GET /v1/settings`

Returns sanitized runtime settings. Requires `x-api-key` unless `EMAIL_REQUIRE_API_KEY=false`.

## Secure communication

Production requests should use both:

- `x-api-key` to identify the trusted backend.
- HMAC signature headers to prove the backend knows `EMAIL_SERVICE_SIGNING_SECRET`.

The signature is calculated over:

```text
timestamp.nonce.METHOD.path.sha256(JSON.stringify(body))
```

Required headers when `EMAIL_REQUIRE_SIGNATURE=true`:

```http
x-email-timestamp: unix_seconds
x-email-nonce: random_unique_string
x-email-signature: hmac_sha256_hex
```

The service rejects requests when the timestamp is outside `EMAIL_SIGNATURE_CLOCK_SKEW_SECONDS`, the nonce was already used, or the signature does not match.

## Template data

All branded templates accept these optional fields in `data`:

```json
{
  "title": "Email heading",
  "message": "Main body copy.",
  "footer": "Small safety/help text.",
  "actionUrl": "https://example.com/action",
  "actionLabel": "Open",
  "appName": "OtherApp",
  "appUrl": "https://other-app.example",
  "supportEmail": "support@other-app.example",
  "theme": {
    "appName": "OtherApp",
    "appUrl": "https://other-app.example",
    "supportEmail": "support@other-app.example",
    "primaryColor": "#2563eb",
    "accentColor": "#06b6d4",
    "background": "#020617",
    "surface": "#0f172a",
    "surfaceSoft": "#111827",
    "border": "#1e293b",
    "text": "#f8fafc",
    "muted": "#cbd5e1"
  }
}
```

Example reusable request for another app:

```bash
curl -X POST https://your-render-service.onrender.com/v1/email/send \
  -H "Content-Type: application/json" \
  -H "x-api-key: $EMAIL_SERVICE_API_KEY" \
  -d '{
    "to": "user@example.com",
    "subject": "Your verification code",
    "template": "otp",
    "data": {
      "code": "123456",
      "message": "Use this code to finish signing in.",
      "theme": {
        "appName": "MySecondApp",
        "appUrl": "https://mysecondapp.example",
        "supportEmail": "help@mysecondapp.example",
        "primaryColor": "#2563eb",
        "accentColor": "#14b8a6"
      }
    }
  }'
```

`POST /v1/email/otp`

```json
{
  "to": "user@example.com",
  "code": "123456",
  "subject": "Verify your OneMoreGift account"
}
```

`GET /v1/queue`

Returns queue stats. Requires `x-api-key`.

`GET /v1/queue/:jobId`

Returns one queued/completed/failed job status. Requires `x-api-key`.

## Render setup

1. Create a new Render web service from this `email-service` directory.
2. Runtime: Node.
3. Build command: `npm ci`
4. Start command: `npm start`
5. Health check path: `/health`
6. Add env vars from `.env.example`.

Important env vars:

```env
EMAIL_SERVICE_API_KEY=long_random_secret
EMAIL_SERVICE_ENABLED=true
EMAIL_REQUIRE_API_KEY=true
EMAIL_REQUIRE_SIGNATURE=true
EMAIL_SERVICE_SIGNING_SECRET=another_long_random_secret
EMAIL_SIGNATURE_CLOCK_SKEW_SECONDS=300
EMAIL_SIGNATURE_NONCE_TTL_SECONDS=600
EMAIL_SIGNATURE_MAX_NONCES=5000
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=120
ENABLE_SEND_ENDPOINT=true
ENABLE_OTP_ENDPOINT=true
ENABLE_BULK_ENDPOINT=true
ENABLE_TEMPLATES_ENDPOINT=true
ENABLE_QUEUE_STATUS_ENDPOINT=true
ENABLE_SETTINGS_ENDPOINT=true
EMAIL_PROVIDER=smtp
EMAIL_FALLBACK_PROVIDERS=brevo
SMTP_ENABLED=true
BREVO_ENABLED=true
EMAIL_DELIVERY_MODE=queue
EMAIL_QUEUE_ENABLED=true
EMAIL_QUEUE_AUTOSTART=true
EMAIL_QUEUE_CONCURRENCY=3
EMAIL_QUEUE_MAX_SIZE=1000
EMAIL_QUEUE_RETRIES=2
EMAIL_QUEUE_RETRY_DELAY_MS=3000
EMAIL_QUEUE_KEEP_COMPLETED=100
EMAIL_QUEUE_KEEP_FAILED=100
SENDER_EMAIL=no-reply@onemoregift.in
SENDER_NAME=OneMoreGift
APP_NAME=OneMoreGift
APP_URL=https://onemoregift.in
SUPPORT_EMAIL=support@onemoregift.in
BRAND_PRIMARY=#ef4444
BRAND_ACCENT=#f97316
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
BREVO_API_KEY=
```

## Queue and scaling notes

Default production mode is `EMAIL_DELIVERY_MODE=queue`. The API returns quickly with a `jobId`, then background workers send email using async concurrency inside the Node process.

Recommended Render starter values:

```env
EMAIL_SERVICE_ENABLED=true
EMAIL_REQUIRE_API_KEY=true
EMAIL_REQUIRE_SIGNATURE=true
ENABLE_SEND_ENDPOINT=true
ENABLE_OTP_ENDPOINT=true
ENABLE_BULK_ENDPOINT=true
EMAIL_DELIVERY_MODE=queue
EMAIL_QUEUE_ENABLED=true
EMAIL_QUEUE_CONCURRENCY=3
EMAIL_QUEUE_MAX_SIZE=1000
EMAIL_QUEUE_RETRIES=2
EMAIL_QUEUE_RETRY_DELAY_MS=3000
```

Useful safe toggles:

```env
# Temporarily stop all email API work except /health.
EMAIL_SERVICE_ENABLED=false

# Disable public support endpoints after deployment verification.
ENABLE_SETTINGS_ENDPOINT=false
ENABLE_TEMPLATES_ENDPOINT=false
ENABLE_QUEUE_STATUS_ENDPOINT=false

# Disable a provider without changing provider order.
SMTP_ENABLED=false
BREVO_ENABLED=true

# Force synchronous delivery for debugging only.
EMAIL_DELIVERY_MODE=sync
EMAIL_QUEUE_ENABLED=false

# Only disable this temporarily for manual curl debugging.
EMAIL_REQUIRE_SIGNATURE=false
```

If your SMTP provider rate-limits you, reduce `EMAIL_QUEUE_CONCURRENCY` to `1` or `2`. If you use Brevo/SendGrid-style transactional APIs, `3` to `5` is usually safe.

Important: this queue is in-memory. It is fast and simple for one Render web service, but queued jobs can be lost if Render restarts while jobs are pending. For heavy production volume or multiple Render instances, upgrade to a durable Redis queue such as BullMQ/Upstash Redis.

## Main backend integration

Set these on the DigitalOcean backend:

```env
EMAIL_SERVICE_URL=https://your-render-service.onrender.com
EMAIL_SERVICE_API_KEY=same_long_random_secret
EMAIL_SERVICE_SIGNING_ENABLED=true
EMAIL_SERVICE_SIGNING_SECRET=same_signing_secret_as_render
EMAIL_SERVICE_ENABLED=true
EMAIL_SERVICE_REQUIRED=false
EMAIL_SERVICE_TIMEOUT_MS=15000
```

The backend will try the Render email service first. If it is not configured or fails, it falls back to the existing in-process Brevo/SMTP code.

## Local test

```bash
npm install
npm test
npm run dev
```

Then:

```bash
curl -X POST http://localhost:8080/v1/email/otp \
  -H "Content-Type: application/json" \
  -H "x-api-key: change_me_to_a_long_random_secret" \
  -d '{"to":"you@example.com","code":"123456"}'
```
