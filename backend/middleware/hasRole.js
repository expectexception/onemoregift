'use strict';

/**
 * RBAC middleware — checks if the authenticated admin has the required permission.
 * Usage: router.get('/route', isAdmin, hasRole('products:write'), controller)
 *
 * Permission format: 'resource:action' e.g. 'products:write', 'users:read'
 * Super admin with '*' permission bypasses all checks.
 */
module.exports = function hasRole(...requiredPermissions) {
    return function (req, res, next) {
        const admin = req.adminDoc; // set by isAdmin middleware
        if (!admin) {
            return res.status(403).json({ error: true, msg: 'Access denied: admin not loaded' });
        }

        const permissions = admin.permissions || [];

        // Super admin bypass
        if (permissions.includes('*')) return next();

        // Check all required permissions
        const hasAll = requiredPermissions.every((perm) => permissions.includes(perm));
        if (!hasAll) {
            return res.status(403).json({
                error: true,
                msg: `Access denied: requires permission(s): ${requiredPermissions.join(', ')}`,
            });
        }

        return next();
    };
};
