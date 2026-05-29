const crypto = require("crypto");
const { config } = require("../config");

const seenNonces = new Map();

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hmac(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqualHex(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function canonicalBody(body) {
  if (body === undefined || body === null) return "";
  return JSON.stringify(body);
}

function signaturePayload({ timestamp, nonce, method, path, body }) {
  return [
    timestamp,
    nonce,
    method.toUpperCase(),
    path,
    sha256(canonicalBody(body)),
  ].join(".");
}

function signRequest({ timestamp, nonce, method, path, body, secret }) {
  return hmac(signaturePayload({ timestamp, nonce, method, path, body }), secret);
}

function pruneNonces(nowMs = Date.now()) {
  const ttlMs = config.signature.nonceTtlSeconds * 1000;
  for (const [nonce, createdAt] of seenNonces.entries()) {
    if (nowMs - createdAt > ttlMs || seenNonces.size > config.signature.maxNonces) {
      seenNonces.delete(nonce);
    }
  }
}

function verifySignedRequest(req) {
  if (!config.signingSecret) {
    return { ok: false, msg: "EMAIL_SERVICE_SIGNING_SECRET is not configured" };
  }

  const timestamp = req.get("x-email-timestamp");
  const nonce = req.get("x-email-nonce");
  const signature = req.get("x-email-signature");
  if (!timestamp || !nonce || !signature) {
    return { ok: false, msg: "Missing signed request headers" };
  }

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) {
    return { ok: false, msg: "Invalid signed request timestamp" };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampNumber) > config.signature.clockSkewSeconds) {
    return { ok: false, msg: "Signed request timestamp is outside the allowed window" };
  }

  pruneNonces();
  if (seenNonces.has(nonce)) {
    return { ok: false, msg: "Signed request nonce was already used" };
  }

  const expected = signRequest({
    timestamp,
    nonce,
    method: req.method,
    path: req.originalUrl,
    body: req.body,
    secret: config.signingSecret,
  });

  if (!safeEqualHex(expected, signature)) {
    return { ok: false, msg: "Invalid signed request signature" };
  }

  seenNonces.set(nonce, Date.now());
  return { ok: true };
}

module.exports = {
  canonicalBody,
  signRequest,
  verifySignedRequest,
};
