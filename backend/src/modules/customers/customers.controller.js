const Customer = require('../../models/Customer');
const Order = require('../../models/Order');
const OrderItem = require('../../models/OrderItem');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');

// GET /customers?q= — cari lewat nama atau nomor WhatsApp (mendukung FR-02, FR-06)
const search = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const filter = q
    ? {
        $or: [
          { nama: { $regex: q, $options: 'i' } },
          { no_wa: { $regex: q, $options: 'i' } },
        ],
      }
    : {};

  const customers = await Customer.find(filter).sort({ nama: 1 }).limit(20);
  res.json({ success: true, data: customers });
});

// GET /customers/:id/orders — riwayat servis satu pelanggan, termasuk rincian suku cadang (FR-06)
const orders = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new AppError('Pelanggan tidak ditemukan', 404);

  const list = await Order.find({ customer: customer._id })
    .sort({ tanggal: -1 })
    .populate('mekanik', 'nama')
    .lean();

  const items = await OrderItem.find({ order: { $in: list.map((o) => o._id) } })
    .populate('part', 'nama')
    .lean();

  const itemsByOrder = items.reduce((acc, it) => {
    const key = String(it.order);
    (acc[key] ||= []).push({
      part: it.part?.nama,
      jumlah: it.jumlah,
      harga_satuan: it.harga_satuan,
    });
    return acc;
  }, {});

  const data = list.map((o) => ({
    ...o,
    items: itemsByOrder[String(o._id)] || [],
  }));

  res.json({ success: true, data: { customer, orders: data } });
});

module.exports = { search, orders };
