const brevo = require("@getbrevo/brevo");
const { config } = require("../config");

async function sendViaBrevo(message) {
  if (!config.brevo.apiKey) {
    throw new Error("Brevo provider is not configured");
  }

  const api = new brevo.TransactionalEmailsApi();
  api.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, config.brevo.apiKey);

  const email = new brevo.SendSmtpEmail();
  email.sender = {
    name: message.fromName || config.sender.name,
    email: message.fromEmail || config.sender.email,
  };
  email.to = Array.isArray(message.to)
    ? message.to.map((to) => ({ email: to }))
    : [{ email: message.to }];
  email.subject = message.subject;
  email.htmlContent = message.html;
  if (message.text) email.textContent = message.text;
  if (message.replyTo) email.replyTo = { email: message.replyTo };

  const result = await api.sendTransacEmail(email);
  return {
    provider: "brevo",
    id: result?.messageId || result?.body?.messageId,
  };
}

module.exports = { sendViaBrevo };
