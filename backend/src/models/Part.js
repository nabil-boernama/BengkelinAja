const mongoose = require('mongoose');

const partSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, unique: true, trim: true },
    harga: { type: Number, required: true, min: 0 },
    stok: { type: Number, required: true, min: 0, default: 0 }, // tidak boleh negatif
    batas_minimum: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Part', partSchema);
