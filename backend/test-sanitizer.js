const sanitizer = require("perfect-express-sanitizer");

const options = {
    xss: true,
    noSql: true
};

const password = "ExpExc@1998$";
const payload = {
    email: "test@example.com",
    password: password
};

// Mock req and res
const req = { body: payload };
const res = {};
const next = () => { };

// sanitizer.clean returns a middleware
const middleware = sanitizer.clean(options);
middleware(req, res, next);

console.log("Original Password:", password);
console.log("Sanitized Password:", req.body.password);

if (password !== req.body.password) {
    console.log("❌ CRITICAL: The sanitizer changed the password!");
} else {
    console.log("✅ The sanitizer did not change the password.");
}
