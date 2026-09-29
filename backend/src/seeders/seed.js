const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("../config/env");
const connectDB = require("../config/db");
const models = require("../models");
const { ROLES } = require("../constants");

const accounts = [
  {
    nama: "Admin Laju Jaya",
    username: "admin",
    peran: ROLES.ADMIN,
    password: process.env.SEED_ADMIN_PASSWORD || "admin123",
  },
  {
    nama: "Budi Mekanik",
    username: "budi",
    peran: ROLES.MEKANIK,
    password: process.env.SEED_MEKANIK_PASSWORD || "mekanik123",
  },
  {
    nama: "Andi Mekanik",
    username: "andi",
    peran: ROLES.MEKANIK,
    password: process.env.SEED_MEKANIK_PASSWORD || "mekanik123",
  },
  {
    nama: "Pak Owner",
    username: "owner",
    peran: ROLES.OWNER,
    password: process.env.SEED_OWNER_PASSWORD || "owner123",
  },
];

(async () => {
  try {
    await connectDB();
    await Promise.all(Object.values(models).map((m) => m.init())); // pastikan index terbentuk

    for (const { password, ...data } of accounts) {
      const password_hash = await bcrypt.hash(password, 10);
      await models.User.findOneAndUpdate(
        { username: data.username },
        { ...data, password_hash, aktif: true },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      console.log(`Seed OK: ${data.username} (${data.peran})`);
    }
  } catch (err) {
    console.error("Seeding gagal:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
