const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const verifyAdmin = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI is not defined in .env");
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const Admin = mongoose.model('admins', new mongoose.Schema({
            username: String,
            email: String,
            password: { type: String, required: true },
            isAdmin: { type: Boolean, default: false }
        }), 'admins');

        const testEmail = "expectexception@gmail.com";
        const testPass = "ExpExc@1998$";

        const admin = await Admin.findOne({ email: testEmail });

        if (!admin) {
            console.log(`❌ FAILED: Admin user with email "${testEmail}" NOT FOUND in the database.`);
            const allAdmins = await Admin.find({});
            console.log(`Total Admins in DB: ${allAdmins.length}`);
            if (allAdmins.length > 0) {
                console.log("Found these email addresses in 'admins' collection:");
                allAdmins.forEach(a => console.log(` - ${a.email}`));
            }
            process.exit(0);
        }

        console.log(`✅ FOUND: Admin user "${admin.username}" exists.`);

        const isMatch = await bcrypt.compare(testPass, admin.password);
        if (isMatch) {
            console.log("✅ PASSWORD MATCH: The password is correct.");
        } else {
            console.log("❌ PASSWORD MISMATCH: The stored password does not match the one in the script.");
        }

        process.exit(0);
    } catch (err) {
        console.error("ERROR:", err);
        process.exit(1);
    }
};
verifyAdmin();
