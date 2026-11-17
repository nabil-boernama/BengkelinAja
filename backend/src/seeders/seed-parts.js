require('../config/env');

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Part = require('../models/Part');
const sampleParts = require('./sampleParts');

async function seedParts() {
  await connectDB();
  await Part.init();

  const result = await Part.bulkWrite(
    sampleParts.map((part) => ({
      updateOne: {
        filter: { nama: part.nama },
        update: { $setOnInsert: part },
        upsert: true,
      },
    })),
    { ordered: true }
  );

  console.log(
    `Seed suku cadang selesai: ${result.upsertedCount} item ditambahkan, ` +
      `${sampleParts.length - result.upsertedCount} item yang sudah ada tidak diubah.`
  );
}

seedParts()
  .catch((err) => {
    console.error('Seeding suku cadang gagal:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
