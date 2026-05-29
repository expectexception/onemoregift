const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { ZodError, z } = require("zod");

const { config, publicConfig } = require("./config");
const { requireApiKey } = require("./middleware/auth");
const { sendEmail, sendOtp, buildOtpMessage, messageSchema, TEMPLATE_NAMES } = require("./mailer");
const { enqueueEmail, enqueueMany, getJob, stats: queueStats } = require("./queue");

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const disabled = (feature) => ({
  error: true,
  msg: `${feature} is disabled by configuration`,
});

const requireFeature = (enabled, feature) => (req, res, next) => {
  if (!enabled) return res.status(503).json(disabled(feature));
  return next();
};

const maybeApiKey = (req, res, next) => {
  if (!config.requireApiKey) return next();
  return requireApiKey(req, res, next);
};

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "500kb" }));
  app.use(morgan(config.env === "production" ? "combined" : "dev"));
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || config.allowedOrigins.length === 0 || config.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin not allowed"));
    },
  }));
  if (config.rateLimit.enabled) {
    app.use(rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
    }));
  }

  app.get("/", (req, res) => {
    res.json({ error: false, service: "onemoregift-email-service" });
  });

  app.get("/health", (req, res) => {
    res.json({
      error: false,
      status: "ok",
      service: "onemoregift-email-service",
      serviceEnabled: config.serviceEnabled,
      provider: config.defaultProvider,
      deliveryMode: config.deliveryMode,
      queue: queueStats(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use(requireFeature(config.serviceEnabled, "Email service"));

  app.get("/v1/settings", maybeApiKey, requireFeature(config.endpoints.settingsEnabled, "Settings endpoint"), (req, res) => {
    res.json({
      error: false,
      settings: publicConfig(),
    });
  });

  app.get("/v1/templates", requireFeature(config.endpoints.templatesEnabled, "Templates endpoint"), (req, res) => {
    res.json({
      error: false,
      templates: TEMPLATE_NAMES,
      defaultBrand: {
        appName: config.brand.appName,
        appUrl: config.brand.appUrl,
        supportEmail: config.brand.supportEmail,
        primaryColor: config.brand.primaryColor,
        accentColor: config.brand.accentColor,
      },
    });
  });

  app.post("/v1/email/send", maybeApiKey, requireFeature(config.endpoints.sendEnabled, "Send endpoint"), asyncHandler(async (req, res) => {
    const message = messageSchema.parse(req.body);
    if (config.queue.enabled) {
      const result = enqueueEmail(message);
      if (result.error) return res.status(429).json(result);
      return res.status(202).json(result);
    }

    const result = await sendEmail(req.body);
    if (result.error) return res.status(502).json(result);
    return res.status(202).json(result);
  }));

  app.post("/v1/email/bulk", maybeApiKey, requireFeature(config.endpoints.bulkEnabled, "Bulk endpoint"), asyncHandler(async (req, res) => {
    const schema = z.object({
      messages: z.array(messageSchema).min(1).max(100),
    });
    const { messages } = schema.parse(req.body);

    if (config.queue.enabled) {
      const result = enqueueMany(messages);
      if (result.error) return res.status(207).json(result);
      return res.status(202).json(result);
    }

    const results = await Promise.all(messages.map((message) => sendEmail(message)));
    const failed = results.filter((result) => result.error);
    return res.status(failed.length > 0 ? 207 : 202).json({
      error: failed.length > 0,
      status: failed.length > 0 ? "partial" : "sent",
      results,
    });
  }));

  app.post("/v1/email/otp", maybeApiKey, requireFeature(config.endpoints.otpEnabled, "OTP endpoint"), asyncHandler(async (req, res) => {
    if (config.queue.enabled) {
      const result = enqueueEmail(buildOtpMessage(req.body));
      if (result.error) return res.status(429).json(result);
      return res.status(202).json(result);
    }

    const result = await sendOtp(req.body);
    if (result.error) return res.status(502).json(result);
    return res.status(202).json(result);
  }));

  app.get("/v1/queue", maybeApiKey, requireFeature(config.endpoints.queueStatusEnabled, "Queue status endpoint"), (req, res) => {
    res.json({ error: false, queue: queueStats() });
  });

  app.get("/v1/queue/:jobId", maybeApiKey, requireFeature(config.endpoints.queueStatusEnabled, "Queue status endpoint"), (req, res) => {
    const job = getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: true, msg: "Job not found" });
    return res.json({ error: false, job });
  });

  app.use((error, req, res, next) => {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: true,
        msg: "Invalid request body",
        details: error.errors.map((item) => ({
          path: item.path.join("."),
          msg: item.message,
        })),
      });
    }

    return res.status(500).json({
      error: true,
      msg: error.message || "Internal server error",
    });
  });

  return app;
}

module.exports = { createApp };
