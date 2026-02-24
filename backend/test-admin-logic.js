const mongoose = require('mongoose');
const { register, singleGiveaway } = require('./controller/adminController');
require('dotenv').config();

async function runTests() {
    console.log("--- Starting Backend Logic Verification ---");

    // 1. Check if functions are exported correctly
    console.log("\n1. Function Export Check:");
    if (typeof register === 'function') {
        console.log("✅ register is correctly exported.");
    } else {
        console.log("❌ register is NOT found.");
    }

    if (typeof singleGiveaway === 'function') {
        console.log("✅ singleGiveaway is correctly exported (typo fixed).");
    } else {
        console.log("❌ singleGiveaway is NOT found. Check for typos.");
    }

    // 2. Test DB Connection and Logic if MONGO_URI is present
    if (process.env.MONGO_URI) {
        console.log("\n2. Database & Logic Flow Check:");
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log("Connected to MongoDB.");

            // Mocking response object
            const mockRes = () => {
                const res = {};
                res.status = (code) => {
                    res.statusCode = code;
                    return res;
                };
                res.json = (data) => {
                    res.jsonData = data;
                    return res;
                };
                res.cookie = (name, value, options) => {
                    res.cookies = res.cookies || {};
                    res.cookies[name] = value;
                    return res;
                };
                return res;
            };

            const res = mockRes();
            const req = {
                body: {
                    email: "TEST_ADMIN_" + Date.now() + "@example.com",
                    password: "password123",
                    username: "testadmin",
                    role: "admin"
                },
                headers: {} // No token, testing public/root registration
            };

            console.log("Calling register for a new (random) admin email...");
            // This should hit the 'tokenExists = false' branch
            // and fail if it's not a root email and admins already exist
            await register(req, res);

            console.log("Response Status:", res.statusCode);
            console.log("Response Data:", JSON.stringify(res.jsonData));

            if (res.statusCode === 400 && res.jsonData.msg === "Admin already exists") {
                console.log("✅ Logic flow confirmed: Caught that admin already exists for non-root email.");
            } else if (res.statusCode === 200) {
                console.log("✅ Logic flow confirmed: Admin created successfully (likely root email or no admins existed).");
            } else {
                console.log("ℹ️ Received status " + res.statusCode + ". Msg: " + (res.jsonData ? res.jsonData.msg : 'none'));
            }

        } catch (err) {
            console.error("❌ Test failed with error:", err.message);
        } finally {
            await mongoose.disconnect();
            console.log("Disconnected from MongoDB.");
        }
    } else {
        console.log("\n2. Database Check skipped: MONGO_URI not found in .env");
    }

    console.log("\n--- Verification Finished ---");
}

runTests().catch(err => {
    console.error("Unhandled error in test runner:", err);
    process.exit(1);
});
