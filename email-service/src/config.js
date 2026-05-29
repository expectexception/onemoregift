require("dotenv").config();

const parseBool = (value, fallback = false) => {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const parseNumber = (value, fallback, min = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, parsed);
};

const parseList = (value) => (value || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8080),
  apiKey: process.env.EMAIL_SERVICE_API_KEY || "",
  serviceEnabled: parseBool(process.env.EMAIL_SERVICE_ENABLED, true),
  requireApiKey: parseBool(process.env.EMAIL_REQUIRE_API_KEY, true),
  requireSignature: parseBool(process.env.EMAIL_REQUIRE_SIGNATURE, true),
  signingSecret: process.env.EMAIL_SERVICE_SIGNING_SECRET || "",
  signature: {
    clockSkewSeconds: parseNumber(process.env.EMAIL_SIGNATURE_CLOCK_SKEW_SECONDS, 300, 30),
    nonceTtlSeconds: parseNumber(process.env.EMAIL_SIGNATURE_NONCE_TTL_SECONDS, 600, 60),
    maxNonces: parseNumber(process.env.EMAIL_SIGNATURE_MAX_NONCES, 5000, 100),
  },
  allowedOrigins: parseList(process.env.CORS_ORIGIN),
  rateLimit: {
    enabled: parseBool(process.env.RATE_LIMIT_ENABLED, true),
    windowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000, 1000),
    max: parseNumber(process.env.RATE_LIMIT_MAX, 120, 1),
  },
  endpoints: {
    sendEnabled: parseBool(process.env.ENABLE_SEND_ENDPOINT, true),
    otpEnabled: parseBool(process.env.ENABLE_OTP_ENDPOINT, true),
    bulkEnabled: parseBool(process.env.ENABLE_BULK_ENDPOINT, true),
    templatesEnabled: parseBool(process.env.ENABLE_TEMPLATES_ENDPOINT, true),
    queueStatusEnabled: parseBool(process.env.ENABLE_QUEUE_STATUS_ENDPOINT, true),
    settingsEnabled: parseBool(process.env.ENABLE_SETTINGS_ENDPOINT, true),
  },
  defaultProvider: process.env.EMAIL_PROVIDER || "smtp",
  fallbackProviders: parseList(process.env.EMAIL_FALLBACK_PROVIDERS),
  providers: {
    smtpEnabled: parseBool(process.env.SMTP_ENABLED, true),
    brevoEnabled: parseBool(process.env.BREVO_ENABLED, true),
  },
  deliveryMode: process.env.EMAIL_DELIVERY_MODE || "queue",
  queue: {
    enabled: parseBool(process.env.EMAIL_QUEUE_ENABLED, process.env.EMAIL_DELIVERY_MODE !== "sync"),
    autostart: parseBool(process.env.EMAIL_QUEUE_AUTOSTART, true),
    concurrency: parseNumber(process.env.EMAIL_QUEUE_CONCURRENCY, 3, 1),
    maxSize: parseNumber(process.env.EMAIL_QUEUE_MAX_SIZE, 1000, 1),
    retries: parseNumber(process.env.EMAIL_QUEUE_RETRIES, 2, 0),
    retryDelayMs: parseNumber(process.env.EMAIL_QUEUE_RETRY_DELAY_MS, 3000, 100),
    keepCompleted: parseNumber(process.env.EMAIL_QUEUE_KEEP_COMPLETED, 100, 0),
    keepFailed: parseNumber(process.env.EMAIL_QUEUE_KEEP_FAILED, 100, 0),
  },
  sender: {
    email: process.env.SENDER_EMAIL || "no-reply@onemoregift.in",
    name: process.env.SENDER_NAME || "OneMoreGift",
  },
  brand: {
    appName: process.env.APP_NAME || "OneMoreGift",
    appUrl: process.env.APP_URL || "https://onemoregift.in",
    supportEmail: process.env.SUPPORT_EMAIL || process.env.SENDER_EMAIL || "support@onemoregift.in",
    primaryColor: process.env.BRAND_PRIMARY || "#ef4444",
    accentColor: process.env.BRAND_ACCENT || "#f97316",
  },
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY || "",
  },
};

function publicConfig() {
  return {
    env: config.env,
    serviceEnabled: config.serviceEnabled,
    requireApiKey: config.requireApiKey,
    requireSignature: config.requireSignature,
    signature: {
      signingSecretConfigured: Boolean(config.signingSecret),
      clockSkewSeconds: config.signature.clockSkewSeconds,
      nonceTtlSeconds: config.signature.nonceTtlSeconds,
      maxNonces: config.signature.maxNonces,
    },
    allowedOrigins: config.allowedOrigins,
    rateLimit: config.rateLimit,
    endpoints: config.endpoints,
    defaultProvider: config.defaultProvider,
    fallbackProviders: config.fallbackProviders,
    providers: config.providers,
    deliveryMode: config.deliveryMode,
    queue: config.queue,
    sender: {
      email: config.sender.email,
      name: config.sender.name,
    },
    brand: config.brand,
    smtp: {
      enabled: config.providers.smtpEnabled,
      hostConfigured: Boolean(config.smtp.host),
      userConfigured: Boolean(config.smtp.user),
      port: config.smtp.port,
      secure: config.smtp.secure,
    },
    brevo: {
      enabled: config.providers.brevoEnabled,
      apiKeyConfigured: Boolean(config.brevo.apiKey),
    },
  };
}

module.exports = { config, publicConfig, parseBool };
