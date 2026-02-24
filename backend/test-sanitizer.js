const sanitizer = require("perfect-express-sanitizer");

const options = {
    xss: true,
    noSql: true
};

const password = "OneMoreGift@2026";
const payload = {
    email: "expectexception@gmail.com",
    password: password
};

// Mock req and res
const req = { body: payload };
const res = {};
const next = () => { };

// sanitizer.clean returns a middleware
const middleware = sanitizer.clean(options);
middleware(req, res, next);

console.log("Original Email:", payload.email);
console.log("Sanitized Email:", req.body.email);

if (payload.email !== req.body.email) {
    console.log("❌ CRITICAL: The sanitizer changed the email!");
} else {
    console.log("✅ The sanitizer did not change the email.");
}

console.log("Original Password:", password);
console.log("Sanitized Password:", req.body.password);

if (password !== req.body.password) {
    console.log("❌ CRITICAL: The sanitizer changed the password!");
} else {
    console.log("✅ The sanitizer did not change the password.");
}
