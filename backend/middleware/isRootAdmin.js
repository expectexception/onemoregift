const Admin = require('../model/Admin');

const ROOT_ADMIN_EMAILS = (process.env.ROOT_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const isRootAdmin = async (req, res, next) => {
  try {
    const email = req.user?.email?.toLowerCase();
    if (!email) {
      return res.status(403).json({
        error: true,
        msg: "Forbidden. Root admin access required.",
      });
    }

    if (ROOT_ADMIN_EMAILS.includes(email)) {
      return next();
    }

    // Safe fallback: when ROOT_ADMIN_EMAILS is not configured, allow only
    // the very first admin account (bootstrap owner) to execute root actions.
    if (ROOT_ADMIN_EMAILS.length === 0) {
      const firstAdmin = await Admin.findOne({ isAdmin: true })
        .sort({ createdAt: 1 })
        .select('email');

      if (firstAdmin?.email?.toLowerCase() === email) {
        return next();
      }
    }

    return res.status(403).json({
      error: true,
      msg: "Forbidden. Root admin access required.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      msg: "Failed to validate root admin permissions.",
    });
  }
};

module.exports = isRootAdmin;
