const { z } = require("zod");
const { config } = require("./config");
const { TEMPLATE_NAMES, renderTemplate, renderTextTemplate } = require("./templates");
const { sendViaSmtp } = require("./providers/smtp");
const { sendViaBrevo } = require("./providers/brevo");

const messageSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email()).min(1)]),
  subject: z.string().min(1).max(200),
  html: z.string().optional(),
  text: z.string().optional(),
  template: z.enum(TEMPLATE_NAMES).optional(),
  data: z.record(z.any()).optional().default({}),
  replyTo: z.string().email().optional(),
  fromEmail: z.string().email().optional(),
  fromName: z.string().optional(),
  provider: z.enum(["smtp", "brevo"]).optional(),
}).superRefine((message, ctx) => {
  if (!message.html && !message.text && !message.template) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["template"],
      message: "Either html, text, or a supported template is required",
    });
  }
});

const otpSchema = z.object({
  to: z.string().email(),
  code: z.string().min(4).max(12),
  subject: z.string().optional(),
  title: z.string().optional(),
  message: z.string().optional(),
  expiresIn: z.string().optional(),
  appName: z.string().optional(),
  appUrl: z.string().url().optional(),
  supportEmail: z.string().email().optional(),
  theme: z.record(z.any()).optional(),
});

function providerList(preferred) {
  const providers = Array.from(new Set([
    preferred || config.defaultProvider,
    ...config.fallbackProviders,
  ].filter(Boolean)));
  return providers.filter((provider) => {
    if (provider === "smtp") return config.providers.smtpEnabled;
    if (provider === "brevo") return config.providers.brevoEnabled;
    return true;
  });
}

async function sendWithProvider(provider, message) {
  if (provider === "brevo") return sendViaBrevo(message);
  if (provider === "smtp") return sendViaSmtp(message);
  throw new Error(`Unsupported provider: ${provider}`);
}

async function sendEmail(rawMessage) {
  const parsed = messageSchema.parse(rawMessage);
  const html = parsed.html || renderTemplate(parsed.template || "custom", parsed.data);
  const text = parsed.text || renderTextTemplate(parsed.template || "custom", parsed.data);
  if (!html && !parsed.text) {
    throw new Error("Either html, text, or a supported template is required");
  }

  const message = { ...parsed, html, text };
  const failures = [];
  const providers = providerList(parsed.provider);

  if (providers.length === 0) {
    return {
      error: true,
      msg: "No enabled email providers are configured",
      failures: [],
    };
  }

  for (const provider of providers) {
    try {
      const result = await sendWithProvider(provider, message);
      return {
        error: false,
        provider: result.provider,
        id: result.id || null,
      };
    } catch (error) {
      failures.push({ provider, msg: error.message });
    }
  }

  return {
    error: true,
    msg: "All email providers failed",
    failures,
  };
}

async function sendOtp(rawOtp) {
  return sendEmail(buildOtpMessage(rawOtp));
}

function buildOtpMessage(rawOtp) {
  const parsed = otpSchema.parse(rawOtp);
  return {
    to: parsed.to,
    subject: parsed.subject || "Your OneMoreGift verification code",
    template: "otp",
    data: {
      code: parsed.code,
      title: parsed.title,
      message: parsed.message,
      expiresIn: parsed.expiresIn,
      appName: parsed.appName,
      appUrl: parsed.appUrl,
      supportEmail: parsed.supportEmail,
      theme: parsed.theme,
    },
  };
}

module.exports = { sendEmail, sendOtp, buildOtpMessage, messageSchema, otpSchema, TEMPLATE_NAMES };
