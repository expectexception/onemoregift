const nodemailer = require("nodemailer");
const { config } = require("../config");

let cachedTransporter;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) {
    throw new Error("SMTP provider is not fully configured");
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  return cachedTransporter;
}

async function sendViaSmtp(message) {
  const transporter = getTransporter();
  const result = await transporter.sendMail({
    from: `"${message.fromName || config.sender.name}" <${message.fromEmail || config.sender.email}>`,
    to: message.to,
    replyTo: message.replyTo,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });

  return {
    provider: "smtp",
    id: result.messageId,
  };
}

module.exports = { sendViaSmtp };
