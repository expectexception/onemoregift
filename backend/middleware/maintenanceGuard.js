'use strict';

const { getConfigHelper } = require('../controller/configController');

// While maintenance mode is on, the public site stays readable but stops accepting
// anything that changes data. Admin routes are exempt. Otherwise turning the switch
// on would lock the admin out of turning it back off.
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Paths that must keep working so an admin can sign in and lift maintenance mode
const ALWAYS_ALLOWED = [
    '/api/v1/admin',
    '/api/v1/auth/admin',
    '/api/v1/config',
];

const maintenanceGuard = async (req, res, next) => {
    if (READ_METHODS.has(req.method)) return next();
    if (ALWAYS_ALLOWED.some(prefix => req.path.startsWith(prefix))) return next();

    try {
        const cfg = await getConfigHelper();
        if (!cfg.maintenanceMode) return next();

        return res.status(503).json({
            error: true,
            maintenance: true,
            msg: cfg.maintenanceMessage || 'The site is temporarily under maintenance. Please try again shortly.',
        });
    } catch (err) {
        // A config read failure must not take the whole API down
        return next();
    }
};

module.exports = maintenanceGuard;
