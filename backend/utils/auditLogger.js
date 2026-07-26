'use strict';

const AuditLog = require('../model/AuditLog');

/**
 * Write an audit log entry.
 * Non-blocking: errors are logged but not thrown.
 *
 * @param {Object} opts
 * @param {string} opts.action - e.g. 'user.ban', 'product.create'
 * @param {string} opts.category - 'user' | 'product' | 'order' | etc.
 * @param {Object} [opts.admin] - req.user object
 * @param {Object} [opts.adminDoc] - req.adminDoc object
 * @param {*} [opts.targetUserId]
 * @param {string} [opts.entityType]
 * @param {*} [opts.entityId]
 * @param {*} [opts.prevValue]
 * @param {*} [opts.newValue]
 * @param {string} [opts.description]
 * @param {Object} [opts.req] - Express request (for IP/UA)
 * @param {*} [opts.metadata]
 */
async function logAction({
    action,
    category,
    admin,
    adminDoc,
    targetUserId,
    entityType,
    entityId,
    prevValue,
    newValue,
    description,
    req,
    metadata,
}) {
    try {
        const ip = req
            ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
            : '';
        const ua = req ? (req.headers['user-agent'] || '') : '';

        await AuditLog.create({
            action,
            category,
            adminId: adminDoc?._id || admin?.id || undefined,
            adminEmail: adminDoc?.email || admin?.email || undefined,
            adminRole: adminDoc?.role || undefined,
            targetUserId: targetUserId || undefined,
            entityType,
            entityId,
            prevValue,
            newValue,
            description,
            ipAddress: ip,
            userAgent: ua,
            metadata,
        });
    } catch (err) {
        console.error('[AuditLog] Failed to write log:', err.message);
    }
}

module.exports = { logAction };
