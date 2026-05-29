const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.EMAIL_SERVICE_API_KEY = "test-key";
process.env.EMAIL_SERVICE_SIGNING_SECRET = "test-signing-secret";
process.env.EMAIL_PROVIDER = "smtp";
process.env.EMAIL_DELIVERY_MODE = "queue";
process.env.EMAIL_QUEUE_AUTOSTART = "false";
process.env.SMTP_HOST = "";
process.env.SMTP_USER = "";
process.env.SMTP_PASS = "";
process.env.BREVO_API_KEY = "";

const crypto = require("node:crypto");
const smtpProvider = require("../src/providers/smtp");
smtpProvider.sendViaSmtp = async () => ({ provider: "smtp", id: "test-message" });

const { createApp } = require("../src/app");
const app = createApp();

function signedHeaders(method, path, body = {}) {
  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const nonce = crypto.randomBytes(16).toString("hex");
  const bodyHash = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
  const payload = [timestamp, nonce, method.toUpperCase(), path, bodyHash].join(".");
  const signature = crypto.createHmac("sha256", "test-signing-secret").update(payload).digest("hex");
  return {
    "x-api-key": "test-key",
    "x-email-timestamp": timestamp,
    "x-email-nonce": nonce,
    "x-email-signature": signature,
  };
}

test("health endpoint returns service status", async () => {
  const res = await request(app).get("/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.error, false);
  assert.equal(res.body.status, "ok");
});

test("templates endpoint returns supported template names", async () => {
  const res = await request(app).get("/v1/templates");
  assert.equal(res.status, 200);
  assert.equal(res.body.error, false);
  assert.ok(res.body.templates.includes("otp"));
  assert.ok(res.body.templates.includes("winner"));
});

test("settings endpoint returns sanitized runtime settings", async () => {
  const res = await request(app)
    .get("/v1/settings")
    .set(signedHeaders("GET", "/v1/settings"));

  assert.equal(res.status, 200);
  assert.equal(res.body.error, false);
  assert.equal(res.body.settings.requireApiKey, true);
  assert.equal(res.body.settings.requireSignature, true);
  assert.equal(res.body.settings.signature.signingSecretConfigured, true);
  assert.equal(res.body.settings.smtp.userConfigured, false);
  assert.equal(res.body.settings.brevo.apiKeyConfigured, false);
  assert.equal(res.body.settings.apiKey, undefined);
});

test("send endpoint rejects missing api key", async () => {
  const res = await request(app).post("/v1/email/send").send({});
  assert.equal(res.status, 401);
  assert.equal(res.body.error, true);
});

test("send endpoint rejects unsigned request", async () => {
  const res = await request(app)
    .post("/v1/email/send")
    .set("x-api-key", "test-key")
    .send({
      to: "user@example.com",
      subject: "Unsigned",
      template: "notification",
      data: { message: "No signature" },
    });

  assert.equal(res.status, 401);
  assert.equal(res.body.error, true);
});

test("send endpoint validates request body", async () => {
  const body = { to: "bad-email", subject: "" };
  const res = await request(app)
    .post("/v1/email/send")
    .set(signedHeaders("POST", "/v1/email/send", body))
    .send(body);

  assert.equal(res.status, 400);
  assert.equal(res.body.error, true);
});

test("send endpoint queues a valid email request", async () => {
  const body = {
    to: "user@example.com",
    subject: "Queued hello",
    template: "notification",
    data: {
      title: "Hello",
      message: "This should be queued.",
    },
  };
  const res = await request(app)
    .post("/v1/email/send")
    .set(signedHeaders("POST", "/v1/email/send", body))
    .send(body);

  assert.equal(res.status, 202);
  assert.equal(res.body.error, false);
  assert.equal(res.body.status, "queued");
  assert.equal(typeof res.body.jobId, "string");
});

test("bulk endpoint queues multiple email requests", async () => {
  const body = {
    messages: [
      {
        to: "one@example.com",
        subject: "One",
        template: "notification",
        data: { message: "First" },
      },
      {
        to: "two@example.com",
        subject: "Two",
        template: "welcome",
        data: { message: "Second" },
      },
    ],
  };
  const res = await request(app)
    .post("/v1/email/bulk")
    .set(signedHeaders("POST", "/v1/email/bulk", body))
    .send(body);

  assert.equal(res.status, 202);
  assert.equal(res.body.error, false);
  assert.equal(res.body.accepted.length, 2);
});

test("queue endpoint exposes queue stats", async () => {
  const res = await request(app)
    .get("/v1/queue")
    .set(signedHeaders("GET", "/v1/queue"));

  assert.equal(res.status, 200);
  assert.equal(res.body.error, false);
  assert.equal(typeof res.body.queue.pending, "number");
});
