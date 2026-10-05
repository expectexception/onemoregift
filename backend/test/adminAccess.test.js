const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const bcrypt = require("bcryptjs");

// The whitelist is read when the modules load, so set it before requiring the app.
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_change_me";
process.env.ADMIN_EMAIL_WHITELIST = "boss@example.com";
delete process.env.ADMIN_OTP_ENABLED;

const { createApp } = require("../app");
const Admin = require("../model/Admin");

const app = createApp();
const PASSWORD = "correct-horse-battery";
const hash = bcrypt.hashSync(PASSWORD, 4);

const withAdmin = async (admin, fn) => {
  const originalFindOne = Admin.findOne;
  const originalFindById = Admin.findById;
  Admin.findOne = async () => admin;
  Admin.findById = async () => admin;
  try {
    await fn();
  } finally {
    Admin.findOne = originalFindOne;
    Admin.findById = originalFindById;
  }
};

const adminDoc = (overrides) => ({
  id: "507f1f77bcf86cd799439011",
  _id: "507f1f77bcf86cd799439011",
  isAdmin: true,
  isActive: true,
  password: hash,
  ...overrides,
});

test("admin login: whitelisted admin gets a token that /admin/me accepts", async () => {
  await withAdmin(adminDoc({ email: "boss@example.com" }), async () => {
    const login = await request(app).post("/api/v1/admin/login").send({ email: "Boss@Example.com", password: PASSWORD });
    assert.equal(login.status, 200);
    assert.equal(login.body.error, false);

    const me = await request(app).get("/api/v1/admin/me").set("Authorization", `Bearer ${login.body.authtoken}`);
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, "boss@example.com");
  });
});

test("admin login: correct password but email not whitelisted is refused at login", async () => {
  await withAdmin(adminDoc({ email: "intern@example.com" }), async () => {
    const res = await request(app).post("/api/v1/admin/login").send({ email: "intern@example.com", password: PASSWORD });
    assert.equal(res.status, 403);
    assert.equal(res.body.error, true);
    assert.match(res.body.msg, /not authorized/);
    assert.equal(res.body.authtoken, undefined);
    assert.equal(res.headers["set-cookie"], undefined);
  });
});

test("admin login: deactivated admin is refused at login", async () => {
  await withAdmin(adminDoc({ email: "boss@example.com", isActive: false }), async () => {
    const res = await request(app).post("/api/v1/admin/login").send({ email: "boss@example.com", password: PASSWORD });
    assert.equal(res.status, 403);
    assert.match(res.body.msg, /deactivated/);
    assert.equal(res.body.authtoken, undefined);
  });
});

test("admin login: wrong password is still a plain 401 (no whitelist hint)", async () => {
  await withAdmin(adminDoc({ email: "intern@example.com" }), async () => {
    const res = await request(app).post("/api/v1/admin/login").send({ email: "intern@example.com", password: "nope" });
    assert.equal(res.status, 401);
    assert.doesNotMatch(res.body.msg, /not authorized/);
  });
});
