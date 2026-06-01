const { config } = require("./config");

const TEMPLATE_NAMES = ["otp", "reset-password", "welcome", "notification", "winner", "custom"];

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeTheme(payload = {}) {
  const theme = payload.theme || {};
  return {
    appName: theme.appName || payload.appName || config.brand.appName,
    appUrl: theme.appUrl || payload.appUrl || config.brand.appUrl,
    supportEmail: theme.supportEmail || payload.supportEmail || config.brand.supportEmail,
    primaryColor: theme.primaryColor || config.brand.primaryColor,
    accentColor: theme.accentColor || config.brand.accentColor,
    background: theme.background || "#050505",
    surface: theme.surface || "#101010",
    surfaceSoft: theme.surfaceSoft || "#18181b",
    border: theme.border || "#27272a",
    text: theme.text || "#f8fafc",
    muted: theme.muted || "#a1a1aa",
  };
}

function brandHtml(theme) {
  const safeName = escapeHtml(theme.appName);
  const giftIndex = safeName.toLowerCase().lastIndexOf("gift");
  if (giftIndex === -1) return safeName;
  return `${safeName.slice(0, giftIndex)}<span style="color:${theme.primaryColor};">${safeName.slice(giftIndex)}</span>`;
}

function paragraph(text, theme) {
  if (!text) return "";
  return `<p style="margin:0 0 18px;color:${theme.muted};font-size:16px;line-height:1.7;">${escapeHtml(text)}</p>`;
}

function button({ url, label }, theme) {
  if (!url) return "";
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 12px;">
      <tr>
        <td style="border-radius:999px;background:${theme.primaryColor};box-shadow:0 16px 36px rgba(239,68,68,.25);">
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 24px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;border-radius:999px;">${escapeHtml(label || "Open")}</a>
        </td>
      </tr>
    </table>`;
}

function otpCode(code, theme) {
  if (!code) return "";
  return `
    <div style="margin:30px auto;padding:20px 16px;max-width:320px;border-radius:22px;background:linear-gradient(135deg, rgba(239,68,68,.22), rgba(249,115,22,.08));border:1px solid rgba(239,68,68,.35);">
      <div style="margin:0;color:${theme.text};font-size:38px;letter-spacing:10px;font-weight:900;line-height:1;text-align:center;">${escapeHtml(code)}</div>
      <div style="margin-top:12px;color:${theme.muted};font-size:12px;letter-spacing:.12em;text-transform:uppercase;text-align:center;">One-time code</div>
    </div>`;
}

function infoList(items = [], theme) {
  if (!Array.isArray(items) || items.length === 0) return "";
  const rows = items
    .filter((item) => item && item.label && item.value)
    .map((item) => `
      <tr>
        <td style="padding:10px 0;color:${theme.muted};font-size:13px;">${escapeHtml(item.label)}</td>
        <td align="right" style="padding:10px 0;color:${theme.text};font-size:13px;font-weight:700;">${escapeHtml(item.value)}</td>
      </tr>`)
    .join("");
  if (!rows) return "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;padding:14px 18px;background:${theme.surfaceSoft};border:1px solid ${theme.border};border-radius:16px;">
      ${rows}
    </table>`;
}

function notice(text, theme) {
  if (!text) return "";
  return `<div style="margin:22px 0 0;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid ${theme.border};color:${theme.muted};font-size:13px;line-height:1.6;">${escapeHtml(text)}</div>`;
}

function layout(payload, content) {
  const theme = normalizeTheme(payload);
  const title = escapeHtml(payload.title || "Notification");
  const preheader = escapeHtml(payload.preheader || payload.message || title);
  const year = new Date().getFullYear();

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${theme.background};font-family:Arial,Helvetica,sans-serif;color:${theme.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.background};padding:34px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;">
          <tr>
            <td style="padding:0 0 18px;text-align:center;">
              <a href="${escapeHtml(theme.appUrl)}" style="display:inline-block;text-decoration:none;color:${theme.text};font-size:26px;font-weight:900;letter-spacing:-.04em;">
                <span style="display:inline-block;width:42px;height:42px;margin-right:10px;vertical-align:middle;border-radius:14px;background:${theme.primaryColor};text-align:center;line-height:42px;color:#ffffff;font-size:22px;">&#127873;</span>
                ${brandHtml(theme)}
              </a>
            </td>
          </tr>
          <tr>
            <td style="border-radius:30px;background:${theme.surface};border:1px solid ${theme.border};overflow:hidden;box-shadow:0 26px 80px rgba(0,0,0,.36);">
              <div style="height:7px;background:linear-gradient(90deg, ${theme.primaryColor}, ${theme.accentColor});"></div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:38px 34px 34px;text-align:center;">
                    ${content(theme)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 18px 0;text-align:center;color:#71717a;font-size:12px;line-height:1.6;">
              <div>Sent by ${escapeHtml(theme.appName)}. Need help? Contact <a href="mailto:${escapeHtml(theme.supportEmail)}" style="color:${theme.primaryColor};text-decoration:none;">${escapeHtml(theme.supportEmail)}</a>.</div>
              <div style="margin-top:6px;">&copy; ${year} ${escapeHtml(theme.appName)}. All rights reserved.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderOtp(payload = {}) {
  return layout({
    ...payload,
    title: payload.title || "Your Verification Code",
    preheader: payload.preheader || "Use this secure one-time code to continue.",
  }, (theme) => `
    <h1 style="margin:0 0 12px;color:${theme.text};font-size:28px;line-height:1.2;letter-spacing:-.03em;">${escapeHtml(payload.title || "Your Verification Code")}</h1>
    ${paragraph(payload.message || "Use this secure one-time code to continue. It expires shortly.", theme)}
    ${otpCode(payload.code, theme)}
    ${infoList([
      { label: "Expires in", value: payload.expiresIn || "5 minutes" },
      { label: "Security", value: "Do not share this code" },
    ], theme)}
    ${notice(payload.footer || "If you did not request this code, you can safely ignore this email.", theme)}
  `);
}

function renderResetPassword(payload = {}) {
  return layout({
    ...payload,
    title: payload.title || "Reset Your Password",
    preheader: payload.preheader || "Use the secure link to set a new password.",
  }, (theme) => `
    <h1 style="margin:0 0 12px;color:${theme.text};font-size:28px;line-height:1.2;letter-spacing:-.03em;">${escapeHtml(payload.title || "Reset Your Password")}</h1>
    ${paragraph(payload.message || "We received a request to reset your account password. Use the secure button below to continue.", theme)}
    ${button({ url: payload.actionUrl, label: payload.actionLabel || "Reset Password" }, theme)}
    ${payload.actionUrl ? `<p style="margin:18px 0 0;color:${theme.muted};font-size:12px;line-height:1.6;word-break:break-all;">Or paste this link into your browser:<br><span style="color:${theme.primaryColor};">${escapeHtml(payload.actionUrl)}</span></p>` : ""}
    ${notice(payload.footer || "This link expires soon. If you did not request it, contact support immediately.", theme)}
  `);
}

function renderWelcome(payload = {}) {
  return layout({
    ...payload,
    title: payload.title || `Welcome to ${normalizeTheme(payload).appName}`,
  }, (theme) => `
    <h1 style="margin:0 0 12px;color:${theme.text};font-size:30px;line-height:1.18;letter-spacing:-.04em;">${escapeHtml(payload.title || "Welcome  d")}</h1>
    ${paragraph(payload.message || `Your ${theme.appName} account is ready. You can now explore giveaways, winners, and rewards.`, theme)}
    ${button({ url: payload.actionUrl || theme.appUrl, label: payload.actionLabel || "Start Exploring" }, theme)}
    ${notice(payload.footer || "We are glad to have you here. Keep your account details private and enjoy responsibly.", theme)}
  `);
}

function renderNotification(payload = {}) {
  return layout(payload, (theme) => `
    <h1 style="margin:0 0 12px;color:${theme.text};font-size:28px;line-height:1.2;letter-spacing:-.03em;">${escapeHtml(payload.title || "Account Notification")}</h1>
    ${paragraph(payload.message || "There is an update related to your account.", theme)}
    ${button({ url: payload.actionUrl, label: payload.actionLabel || "Open App" }, theme)}
    ${notice(payload.footer, theme)}
  `);
}

function renderWinner(payload = {}) {
  return layout({
    ...payload,
    title: payload.title || "You are a winner",
    preheader: payload.preheader || "Congratulations, you have won a giveaway.",
  }, (theme) => `
    <h1 style="margin:0 0 12px;color:${theme.text};font-size:32px;line-height:1.12;letter-spacing:-.04em;">${escapeHtml(payload.title || "You are a winner")}</h1>
    ${paragraph(payload.message || "Congratulations. You have been selected as a giveaway winner.", theme)}
    ${infoList([
      { label: "Prize", value: payload.prize },
      { label: "Giveaway", value: payload.giveaway },
    ], theme)}
    ${button({ url: payload.actionUrl || normalizeTheme(payload).appUrl, label: payload.actionLabel || "View Details" }, theme)}
    ${notice(payload.footer || "Our team may contact you for delivery verification. Never share passwords or OTPs.", theme)}
  `);
}

function renderTemplate(template = "custom", payload = {}) {
  if (template === "custom") return payload.html;
  if (template === "otp") return renderOtp(payload);
  if (template === "reset-password") return renderResetPassword(payload);
  if (template === "welcome") return renderWelcome(payload);
  if (template === "notification") return renderNotification(payload);
  if (template === "winner") return renderWinner(payload);
  throw new Error(`Unsupported template: ${template}`);
}

function renderTextTemplate(template = "custom", payload = {}) {
  if (payload.text) return payload.text;
  const theme = normalizeTheme(payload);
  const lines = [
    payload.title || template,
    payload.message,
    payload.code ? `Code: ${payload.code}` : "",
    payload.actionUrl ? `Link: ${payload.actionUrl}` : "",
    payload.footer,
    `Sent by ${theme.appName}. Support: ${theme.supportEmail}`,
  ];
  return lines.filter(Boolean).join("\n\n");
}

module.exports = {
  TEMPLATE_NAMES,
  normalizeTheme,
  renderTemplate,
  renderTextTemplate,
};
