'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ROLES = [
    'super_admin',
    'admin',
    'verification_manager',
    'inventory_manager',
    'store_manager',
    'content_moderator',
    'support_agent',
];

// Permission map per role
const ROLE_PERMISSIONS = {
    super_admin: ['*'],
    admin: [
        'users:read', 'users:write', 'users:delete',
        'surprise:read', 'surprise:write',
        'moments:read', 'moments:write',
        'products:read', 'products:write',
        'orders:read', 'orders:write',
        'stores:read', 'stores:write',
        'gifts:read', 'gifts:write',
        'reports:read',
    ],
    verification_manager: ['surprise:read', 'surprise:write', 'users:read'],
    inventory_manager: ['products:read', 'products:write', 'stores:read'],
    store_manager: ['orders:read', 'orders:write', 'stores:read', 'stores:write'],
    content_moderator: ['moments:read', 'moments:write'],
    support_agent: ['users:read', 'orders:read'],
};

const AdminSchema = new Schema({
    username: { type: String },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    image: { type: String },
    isAdmin: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    role: {
        type: String,
        enum: ROLES,
        default: 'admin',
    },
    // Extra per-admin permissions beyond role defaults
    extraPermissions: [{ type: String }],
    loginOtp: {
        token: { type: String },
        expires: { type: Date },
        attempts: { type: Number, default: 0 },
    },
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },
}, { timestamps: true, versionKey: false });

// Virtual: resolved permissions
AdminSchema.virtual('permissions').get(function () {
    const base = ROLE_PERMISSIONS[this.role] || [];
    if (base.includes('*')) return ['*'];
    return Array.from(new Set([...base, ...(this.extraPermissions || [])]));
});

AdminSchema.set('toObject', { virtuals: true });
AdminSchema.set('toJSON', { virtuals: true });

const Admin = mongoose.model('admins', AdminSchema);
module.exports = Admin;
module.exports.ROLES = ROLES;
module.exports.ROLE_PERMISSIONS = ROLE_PERMISSIONS;