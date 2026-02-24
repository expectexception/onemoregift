const mongoose = require('mongoose');
const Admin = require('./model/Admin');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const testEmail = "expectexception@gmail.com";
        const testPass = "ExpExc@1998$";

        console.log(`Diagnosing email: [${testEmail}]`);

        // Try exact match
        let user = await Admin.findOne({ email: testEmail });
        if (user) {
            console.log("✅ User found with exact match.");
        } else {
            console.log("❌ User NOT found with exact match.");
            // Try case-insensitive regex match like in controller
            user = await Admin.findOne({ email: { $regex: new RegExp(`^${testEmail}$`, 'i') } });
            if (user) {
                console.log("✅ User found with regex match.");
            } else {
                console.log("❌ User NOT found with regex match either.");
                const all = await Admin.find({});
                console.log(`Total admins in collection: ${all.length}`);
                all.forEach(a => console.log(` - Email in DB: [${a.email}]`));
                return;
            }
        }

        const isMatch = await bcrypt.compare(testPass, user.password);
        if (isMatch) {
            console.log("✅ Password matches hash in DB.");
        } else {
            console.log("❌ Password DOES NOT match hash in DB.");
        }

    } catch (err) {
        console.error("Diagnosis error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

diagnose();
