const ROOT_ADMIN_EMAILS = (process.env.ROOT_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const isRootAdmin = (req, res, next) => {
  const email = req.user?.email?.toLowerCase();
  if (!email || !ROOT_ADMIN_EMAILS.includes(email)) {
    return res.status(403).json({
      error: true,
      msg: "Forbidden. Root admin access required.",
    });
  }
  return next();
};

module.exports = isRootAdmin;
