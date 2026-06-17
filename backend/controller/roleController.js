'use strict';

const Admin = require('../model/Admin');
const bcrypt = require('bcryptjs');
const { logAction } = require('../utils/auditLogger');
const { ROLES, ROLE_PERMISSIONS } = require('../model/Admin');

// GET /api/v1/admin/roles/admins — list all admins with roles
const listAdmins = async (req, res) => {
    try {
        const admins = await Admin.find({}).select('-password -loginOtp').sort({ createdAt: -1 });
        return res.json({ error: false, data: admins });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch admins' });
    }
};

// PATCH /api/v1/admin/roles/admins/:id/role
const updateRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!ROLES.includes(role)) {
            return res.status(400).json({ error: true, msg: `Invalid role. Must be one of: ${ROLES.join(', ')}` });
        }

        const prev = await Admin.findById(req.params.id).lean();
        if (!prev) return res.status(404).json({ error: true, msg: 'Admin not found' });

        // Prevent self-demotion of super_admin
        if (prev._id.toString() === req.user.id && role !== 'super_admin' && prev.role === 'super_admin') {
            return res.status(400).json({ error: true, msg: 'Cannot demote your own super_admin account' });
        }

        const doc = await Admin.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password -loginOtp');

        await logAction({
            action: 'admin.role_change',
            category: 'admin',
            admin: req.user,
            adminDoc: req.adminDoc,
            entityType: 'Admin',
            entityId: doc._id,
            prevValue: { role: prev.role },
            newValue: { role },
            req,
        });

        return res.json({ error: false, data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to update role' });
    }
};

// PATCH /api/v1/admin/roles/admins/:id/activate
const toggleActive = async (req, res) => {
    try {
        const doc = await Admin.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: true, msg: 'Admin not found' });
        doc.isActive = !doc.isActive;
        await doc.save();

        await logAction({
            action: doc.isActive ? 'admin.activated' : 'admin.deactivated',
            category: 'admin',
            admin: req.user,
            adminDoc: req.adminDoc,
            entityType: 'Admin',
            entityId: doc._id,
            req,
        });

        return res.json({ error: false, msg: `Admin ${doc.isActive ? 'activated' : 'deactivated'}` });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to toggle admin status' });
    }
};

// PATCH /api/v1/admin/roles/admins/:id/permissions
const updatePermissions = async (req, res) => {
    try {
        const { extraPermissions } = req.body;
        const doc = await Admin.findByIdAndUpdate(
            req.params.id,
            { extraPermissions },
            { new: true }
        ).select('-password -loginOtp');
        if (!doc) return res.status(404).json({ error: true, msg: 'Admin not found' });
        return res.json({ error: false, data: doc });
    } catch (err) {
        return res.status(500).json({ error: true, msg: 'Failed to update permissions' });
    }
};

// GET /api/v1/admin/roles/matrix — permission matrix
const getMatrix = async (req, res) => {
    return res.json({ error: false, data: { roles: ROLES, permissions: ROLE_PERMISSIONS } });
};

module.exports = { listAdmins, updateRole, toggleActive, updatePermissions, getMatrix };
