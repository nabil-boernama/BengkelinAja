const mongoose = require('mongoose');
const { ORDER_STATUS } = require('../constants');

const { Schema } = mongoose;

const orderStatusLogSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  status_baru: { type: String, enum: Object.values(ORDER_STATUS), required: true },
  diubah_oleh: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  waktu: { type: Date, default: Date.now },
});

orderStatusLogSchema.index({ order: 1, waktu: 1 });

module.exports = mongoose.model('OrderStatusLog', orderStatusLogSchema);
