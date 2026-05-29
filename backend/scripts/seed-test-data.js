const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const Admin = require("../model/Admin");
const Users = require("../model/Users");
const Giveaway = require("../model/Giveaway");
const JoinedGiveaway = require("../model/JoinedGiveaways");

dotenv.config();

async function seed() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/giveaway_test";
  await mongoose.connect(mongoUri);

  const adminEmail = "expectexception@gmail.com";
  const adminPassword = "Admin@123";
  const userEmail = "e2e.user@example.com";
  const userPassword = "UserPass123!";

  const [adminHash, userHash] = await Promise.all([
    bcrypt.hash(adminPassword, 10),
    bcrypt.hash(userPassword, 10),
  ]);

  const [admin, user] = await Promise.all([
    Admin.findOneAndUpdate(
      { email: adminEmail },
      {
        username: "RootAdmin",
        email: adminEmail,
        password: adminHash,
        isAdmin: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
    Users.findOneAndUpdate(
      { email: userEmail },
      {
        name: "E2E Test User",
        phone: "9876" + Math.floor(100000 + Math.random() * 900000),
        email: userEmail,
        password: userHash,
        blocked: false,
        isVerified: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
  ]);

  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const giveaway = await Giveaway.findOneAndUpdate(
    { title: "E2E Seed Giveaway" },
    {
      title: "E2E Seed Giveaway",
      description: "Deterministic seeded giveaway for local automation.",
      prize: "Seed Prize",
      winnerCount: 1,
      maxParticipants: 100,
      prizeValue: 5000,
      startDate: now,
      endDate: end,
      image: "/images/gift.png",
      participants: [user._id],
      winners: [],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await JoinedGiveaway.findOneAndUpdate(
    { user: user._id, giveaway: giveaway._id },
    { user: user._id, giveaway: giveaway._id, won: false },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log("Seed complete");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`User:  ${userEmail} / ${userPassword}`);
  console.log(`Giveaway: ${giveaway.title}`);

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("Seed failed:", error);
    try {
      await mongoose.disconnect();
    } catch {
    }
    process.exit(1);
  });
