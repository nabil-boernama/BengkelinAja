const mongoose = require('mongoose');

// Penghitung atomik untuk no antrean harian. _id contoh: "antrean-2026-09-29"
// Dipakai dengan findOneAndUpdate({ $inc: { seq: 1 } }, { upsert: true, new: true })
const counterSchema = new mongoose.Schema({
  _id: { type: String },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
