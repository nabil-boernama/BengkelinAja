const mongoose = require('mongoose');

const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    part: { type: Schema.Types.ObjectId, ref: 'Part', required: true },
    jumlah: { type: Number, required: true, min: 1 },
    harga_satuan: { type: Number, required: true, min: 0 }, // harga saat dicatat
  },
  { timestamps: true }
);

orderItemSchema.index({ order: 1, part: 1 }, { unique: true });

module.exports = mongoose.model('OrderItem', orderItemSchema);
