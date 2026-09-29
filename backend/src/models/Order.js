const mongoose = require('mongoose');
const { ORDER_STATUS } = require('../constants');

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    no_antrean: { type: Number, required: true },
    // Kunci hari (YYYY-MM-DD, WIB) supaya no antrean unik per hari
    tanggal_key: { type: String, required: true },
    tanggal: { type: Date, default: Date.now },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    // Plat dinormalisasi: tanpa spasi, huruf besar (AB 1234 CD -> AB1234CD)
    plat: {
      type: String,
      required: true,
      set: (v) => String(v).replace(/\s+/g, '').toUpperCase(),
    },
    keluhan: { type: String, required: true, trim: true },
    mekanik: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.ANTRE,
    },
    biaya_jasa: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

orderSchema.index({ tanggal_key: 1, no_antrean: 1 }, { unique: true });
orderSchema.index({ plat: 1 });
orderSchema.index({ mekanik: 1, status: 1 });
orderSchema.index({ customer: 1 });

module.exports = mongoose.model('Order', orderSchema);
