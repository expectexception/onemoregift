/**
 * CLEAN DATABASE SCRIPT
 * This script will delete all users (except admins), giveaways, and winners.
 */
const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function cleanDB() {
    try {
        console.log('WARNING: This will delete ALL users, giveaways, and winners from the database.');
        const confirm = await askQuestion('Are you absolutely sure? Type "DELETE EVERYTHING" to proceed: ');

        if (confirm !== 'DELETE EVERYTHING') {
            console.log('Aborted.');
            process.exit(0);
        }

        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        // Delete collections
        console.log('Cleaning collections...');

        // We keep the Admins if possible, but the current schema puts all users in the 'users' collection.
        // We will delete all users except those with role 'admin' or special emails.
        const usersResult = await db.collection('users').deleteMany({
            email: { $nin: ['expectexception@gmail.com', 'admin@onemoregift.in'] }
        });
        console.log(`Deleted ${usersResult.deletedCount} users (kept admins).`);

        const giveawaysResult = await db.collection('giveaways').deleteMany({});
        console.log(`Deleted ${giveawaysResult.deletedCount} giveaways.`);

        const winnersResult = await db.collection('winners').deleteMany({});
        console.log(`Deleted ${winnersResult.deletedCount} winners.`);

        console.log('Database cleanup completed successfully!');
    } catch (error) {
        console.error('Error cleaning database:', error);
    } finally {
        await mongoose.disconnect();
        rl.close();
    }
}

cleanDB();
