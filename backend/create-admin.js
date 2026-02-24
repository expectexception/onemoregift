const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdmin = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI is not defined in .env");
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);

        // Define Admin Schema matching model/Admin.js
        const Admin = mongoose.model('admins', new mongoose.Schema({
            username: String,
            email: { type: String, unique: true },
            password: { type: String, required: true },
            isAdmin: { type: Boolean, default: false }
        }), 'admins');

        const email = "expectexception@gmail.com";
        const password = "ExpExc@1998$"; // CHANGE THIS BEFORE RUNNING

        if (password === "admin_password_here") {
            console.error("ERROR: Please change the password in create-admin.js before running!");
            process.exit(1);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await Admin.findOneAndUpdate(
            { email: email },
            {
                username: "SuperAdmin",
                email: email,
                password: hashedPassword,
                isAdmin: true
            },
            { upsert: true, new: true }
        );

        console.log("SUCCESS: Master Admin account is ready for " + email);
        console.log("You can now login at https://onemoregift.in/admin");
        process.exit(0);
    } catch (err) {
        console.error("ERROR:", err);
        process.exit(1);
    }
};
createAdmin();
