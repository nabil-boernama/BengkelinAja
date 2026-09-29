const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true },
    // no_wa boleh kosong (NFR Reliability), tapi kalau ada harus unik
    no_wa: { type: String, trim: true },
  },
  { timestamps: true }
);

customerSchema.index(
  { no_wa: 1 },
  { unique: true, partialFilterExpression: { no_wa: { $type: 'string' } } }
);
customerSchema.index({ nama: 1 });

module.exports = mongoose.model('Customer', customerSchema);
