const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true },
    no_wa: {
      type: String,
      trim: true,
      set: (value) => (value == null ? value : String(value).replace(/\D/g, '')),
    },
  },
  { timestamps: true }
);

customerSchema.index(
  { no_wa: 1 },
  { unique: true, partialFilterExpression: { no_wa: { $type: 'string' } } }
);
customerSchema.index({ nama: 1 });

module.exports = mongoose.model('Customer', customerSchema);
