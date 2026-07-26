'use strict';

/**
 * CLEAN DATABASE SCRIPT
 * Deletes all users (except root admins), giveaways, winners,
 * joined giveaways, and pending registrations.
 * Admin accounts are preserved.
 */

const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const ROOT_ADMIN_EMAILS = (process.env.ROOT_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

if (!MONGO_URI) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function cleanDB() {
    try {
        console.log('\n⚠️  WARNING: This will delete all users, giveaways, and participations.');
        console.log(`   Preserving admin emails: ${ROOT_ADMIN_EMAILS.join(', ') || '(none)'}`);
        const confirm = await ask('\nType "DELETE EVERYTHING" to proceed: ');

        if (confirm.trim() !== 'DELETE EVERYTHING') {
            console.log('Aborted.');
            process.exit(0);
        }

        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // Users: preserve root admin emails
        const usersResult = await db.collection('users').deleteMany(
            ROOT_ADMIN_EMAILS.length > 0
                ? { email: { $nin: ROOT_ADMIN_EMAILS } }
                : {}
        );
        console.log(`✓ Deleted ${usersResult.deletedCount} users`);

        // Pending registrations: all
        const pendingResult = await db.collection('pendingregistrations').deleteMany({});
        console.log(`✓ Deleted ${pendingResult.deletedCount} pending registrations`);

        // Giveaways
        const giveawaysResult = await db.collection('giveaways').deleteMany({});
        console.log(`✓ Deleted ${giveawaysResult.deletedCount} giveaways`);

        // Joined giveaways
        const joinedResult = await db.collection('joinedgiveaways').deleteMany({});
        console.log(`✓ Deleted ${joinedResult.deletedCount} joined giveaway entries`);

        // Winners (legacy collection)
        const winnersResult = await db.collection('winners').deleteMany({});
        console.log(`✓ Deleted ${winnersResult.deletedCount} winner records`);

        console.log('\n✅ Database cleanup complete.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        rl.close();
    }
}

cleanDB();
