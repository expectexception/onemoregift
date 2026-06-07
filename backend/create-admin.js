'use strict';

/**
 * CREATE ADMIN SCRIPT
 * Creates/updates the root admin account from .env credentials.
 * Run: node create-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'RootAdmin';

if (!MONGO_URI) { console.error('MONGO_URI missing'); process.exit(1); }
if (!ADMIN_EMAIL) { console.error('ADMIN_EMAIL missing'); process.exit(1); }
if (!ADMIN_PASSWORD || ADMIN_PASSWORD === 'your_secure_password') {
    console.error('Set a real ADMIN_PASSWORD in .env');
    process.exit(1);
}

async function createAdmin() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Load Admin model after connection
    const Admin = require('./model/Admin');

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const existing = await Admin.findOne({ email: ADMIN_EMAIL });

    if (existing) {
        existing.password = hashedPassword;
        existing.username = ADMIN_USERNAME;
        existing.isAdmin = true;
        existing.role = 'admin';
        await existing.save();
        console.log(`✓ Admin updated: ${ADMIN_EMAIL}`);
    } else {
        await Admin.create({
            email: ADMIN_EMAIL,
            username: ADMIN_USERNAME,
            password: hashedPassword,
            isAdmin: true,
            role: 'admin',
        });
        console.log(`✓ Admin created: ${ADMIN_EMAIL}`);
    }

    console.log(`  Username : ${ADMIN_USERNAME}`);
    console.log(`  Email    : ${ADMIN_EMAIL}`);
    console.log('\n✅ Done. You can now log in at /admin/login');

    await mongoose.disconnect();
}

createAdmin().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
