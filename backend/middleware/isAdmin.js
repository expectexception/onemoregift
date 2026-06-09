'use strict';

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// Feature flag: comma-separated list of admin emails allowed to access panel.
// If empty/unset, all valid admin tokens are permitted.
const ADMIN_EMAIL_WHITELIST = (process.env.ADMIN_EMAIL_WHITELIST || "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

const isAdmin = (req, res, next) => {
    const authHeader = req.header("Authorization");
    const cookieToken = req.cookies?.admin_token;
    const cleanToken = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : cookieToken;

    if (!cleanToken) {
        return res.status(401).json({ error: true, msg: "Access denied. Please authenticate using a valid token." });
    }

    try {
        const data = jwt.verify(cleanToken, JWT_SECRET);
        req.user = data.user;

        if (!data.user.isAdmin) {
            return res.status(401).json({ error: true, msg: "Access denied. Please authenticate using a valid token." });
        }

        // Email whitelist check — instant lockout without changing passwords
        if (ADMIN_EMAIL_WHITELIST.length > 0) {
            const adminEmail = (data.user.email || "").toLowerCase();
            if (!ADMIN_EMAIL_WHITELIST.includes(adminEmail)) {
                console.warn(`[isAdmin] Access denied for non-whitelisted email: ${adminEmail}`);
                return res.status(403).json({ error: true, msg: "Access denied. Your account is not authorized for admin panel access." });
            }
        }
    } catch (error) {
        return res.status(401).json({ error: true, msg: "Access denied. Please authenticate using a valid token." });
    }

    next();
};

module.exports = isAdmin;