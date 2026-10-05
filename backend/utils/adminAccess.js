'use strict';

// Feature flag: comma-separated list of admin emails allowed to access panel.
// If empty/unset, all valid admin accounts are permitted.
const ADMIN_EMAIL_WHITELIST = (process.env.ADMIN_EMAIL_WHITELIST || "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

const isWhitelistedAdminEmail = (email) =>
    ADMIN_EMAIL_WHITELIST.length === 0 ||
    ADMIN_EMAIL_WHITELIST.includes((email || "").toLowerCase());

const NOT_WHITELISTED_MSG = "Access denied. Your account is not authorized for admin panel access.";
const DEACTIVATED_MSG = "Admin account is deactivated.";

module.exports = { isWhitelistedAdminEmail, NOT_WHITELISTED_MSG, DEACTIVATED_MSG };
