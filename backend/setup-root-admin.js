const mongoose = require('mongoose');
const Admin = require('./model/Admin');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function createAdmin() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri || mongoUri.includes('ROTATE_AND_FILL')) {
            console.error('MONGO_URI is not configured. Set backend/.env to your production MongoDB URI first.');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);

        const email = process.env.ADMIN_EMAIL || 'expectexception@gmail.com';
        const password = process.env.ADMIN_PASSWORD || 'Admin@123';
        const username = process.env.ADMIN_USERNAME || 'RootAdmin';

        const existingAdmin = await Admin.findOne({ email });
        console.log(existingAdmin ? 'Admin already exists. Updating password...' : 'Creating new admin...');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const admin = await Admin.findOneAndUpdate(
            { email },
            {
                username,
                email,
                password: hashedPassword,
                isAdmin: true
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const passwordVerified = await bcrypt.compare(password, admin.password);
        if (!passwordVerified) {
            throw new Error('Admin password verification failed after save');
        }
        console.log(existingAdmin ? 'Password updated successfully.' : 'Admin created successfully.');

        console.log('\n--- Admin Credentials ---');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('-------------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('Error creating/updating admin:', error);
        process.exit(1);
    }
}

createAdmin();
