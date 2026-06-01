const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_change_me";

const { createApp } = require("../app");
const Admin = require("../model/Admin");
const Giveaway = require("../model/Giveaway");
const Users = require("../model/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = createApp();

test("auth/login contract: invalid payload returns error schema", async () => {
  const res = await request(app).post("/api/v1/auth/login").send({});
  assert.equal(res.status, 400);
  assert.equal(typeof res.body.error, "boolean");
  assert.equal(res.body.error, true);
  assert.equal(typeof res.body.msg, "string");
});

test("admin/login contract: bad credentials return 401 schema", async () => {
  const originalFindOne = Admin.findOne;
  Admin.findOne = async () => null;

  try {
    const res = await request(app).post("/api/v1/admin/login").send({
      email: "missing@example.com",
      password: "wrong",
    });
    assert.equal(res.status, 401);
    assert.equal(typeof res.body.error, "boolean");
    assert.equal(res.body.error, true);
    assert.equal(typeof res.body.msg, "string");
  } finally {
    Admin.findOne = originalFindOne;
  }
});

test("giveaway list contract: response includes error/data/total and participantCount", async () => {
  const originalCount = Giveaway.countDocuments;
  const originalFind = Giveaway.find;

  Giveaway.countDocuments = async () => 1;
  Giveaway.find = () => ({
    sort: () => ({
      skip: () => ({
        limit: () => ({
          lean: async () => ([
            {
              _id: "507f1f77bcf86cd799439011",
              title: "Contract Giveaway",
              participants: ["u1", "u2"],
            },
          ]),
        }),
      }),
    }),
  });

  try {
    const res = await request(app).get("/api/v1/giveaway?page=1&limit=10");
    assert.equal(res.status, 200);
    assert.equal(res.body.error, false);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(typeof res.body.total, "number");
    assert.equal(typeof res.body.data[0].participantCount, "number");
  } finally {
    Giveaway.countDocuments = originalCount;
    Giveaway.find = originalFind;
  }
});

test("admin stats contract: returns numeric metrics schema", async () => {
  const originalCount = Giveaway.countDocuments;
  const originalFind = Giveaway.find;

  Giveaway.countDocuments = async () => 3;
  Giveaway.find = async (query) => {
    if (query && query.winners) {
      return [{ winners: [1, 2] }, { winners: [3] }];
    }
    return [{ prizeValue: 1000 }, { prizeValue: 2000 }];
  };

  try {
    const res = await request(app).get("/api/v1/admin/stats");
    assert.equal(res.status, 200);
    assert.equal(res.body.error, false);
    assert.equal(typeof res.body.activeGiveaways, "number");
    assert.equal(typeof res.body.totalWinners, "number");
    assert.equal(typeof res.body.totalPrizeValue, "number");
    assert.equal(typeof res.body.verifiedLegit, "number");
  } finally {
    Giveaway.countDocuments = originalCount;
    Giveaway.find = originalFind;
  }
});

test("auth/reset-pass contract: unknown email returns generic success", async () => {
  const originalFindOne = Users.findOne;
  Users.findOne = async () => null;

  try {
    const res = await request(app).post("/api/v1/auth/reset-pass").send({
      email: "missing@example.com",
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.error, false);
    assert.equal(typeof res.body.msg, "string");
    assert.equal(res.body.emailSent, false);
  } finally {
    Users.findOne = originalFindOne;
  }
});

test("profile/change-pass contract: Google user can set first local password without old password", async () => {
  const originalFindById = Users.findById;
  const userId = "507f1f77bcf86cd799439011";
  const token = jwt.sign({ data: { _id: userId, email: "google@example.com", name: "Google User" } }, process.env.JWT_SECRET);
  let saved = false;

  Users.findById = async () => ({
    _id: userId,
    isGoogleAuth: true,
    localPasswordSet: false,
    password: await bcrypt.hash("unknown-random-password", 10),
    save: async function save() {
      saved = true;
      assert.equal(this.localPasswordSet, true);
    },
  });

  try {
    const res = await request(app)
      .patch("/api/v1/profile/change-pass")
      .set("Authorization", `Bearer ${token}`)
      .send({ newPassword: "NewPass123!" });

    assert.equal(res.status, 200);
    assert.equal(res.body.error, false);
    assert.equal(saved, true);
  } finally {
    Users.findById = originalFindById;
  }
});

test("profile/change-pass contract: normal user must provide old password", async () => {
  const originalFindById = Users.findById;
  const userId = "507f1f77bcf86cd799439012";
  const token = jwt.sign({ data: { _id: userId, email: "local@example.com", name: "Local User" } }, process.env.JWT_SECRET);

  Users.findById = async () => ({
    _id: userId,
    isGoogleAuth: false,
    localPasswordSet: true,
    password: await bcrypt.hash("OldPass123!", 10),
    save: async () => {},
  });

  try {
    const res = await request(app)
      .patch("/api/v1/profile/change-pass")
      .set("Authorization", `Bearer ${token}`)
      .send({ newPassword: "NewPass123!" });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, true);
    assert.equal(res.body.msg, "Old password is required");
  } finally {
    Users.findById = originalFindById;
  }
});
