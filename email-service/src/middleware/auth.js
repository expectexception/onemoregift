const { config } = require("../config");
const { verifySignedRequest } = require("../security/signature");

function requireApiKey(req, res, next) {
  if (config.requireApiKey && !config.apiKey) {
    return res.status(500).json({
      error: true,
      msg: "EMAIL_SERVICE_API_KEY is not configured",
    });
  }

  const token = req.get("x-api-key") || req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (config.requireApiKey && token !== config.apiKey) {
    return res.status(401).json({ error: true, msg: "Unauthorized" });
  }

  if (config.requireSignature) {
    const verified = verifySignedRequest(req);
    if (!verified.ok) {
      return res.status(401).json({ error: true, msg: verified.msg });
    }
  }

  return next();
}

module.exports = { requireApiKey };
