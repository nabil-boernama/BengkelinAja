const Customer = require('../../models/Customer');
const Order = require('../../models/Order');
const OrderItem = require('../../models/OrderItem');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { ROLES } = require('../../constants');

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
  const latestOrders = customers.length
    ? await Order.aggregate([
        { $match: { customer: { $in: customers.map((customer) => customer._id) } } },
        { $sort: { tanggal: -1, no_antrean: -1 } },
        { $group: { _id: '$customer', plat: { $first: '$plat' } } },
      ])
    : [];
  const latestPlateByCustomer = new Map(
    latestOrders.map((order) => [String(order._id), order.plat])
  );
  const data = customers.map((customer) => ({
    ...customer.toObject(),
    plat_terakhir: latestPlateByCustomer.get(String(customer._id)) || '',
  }));
  res.json({ success: true, data });
});

// GET /customers/plates?q= — daftar plat terdaftar untuk pencarian riwayat.
const plates = asyncHandler(async (req, res) => {
  const prefix = String(req.query.q || '').replace(/\s+/g, '').toUpperCase();
  const filter = {};
  if (prefix) {
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.plat = { $regex: `^${escapedPrefix}` };
  }
  if (req.user.peran === ROLES.MEKANIK) filter.mekanik = req.user._id;

  const data = await Order.aggregate([
    { $match: filter },
    { $group: { _id: '$plat', latest: { $max: '$tanggal' } } },
    { $sort: { latest: -1, _id: 1 } },
    { $limit: 100 },
    { $project: { _id: 0, plat: '$_id' } },
  ]);
  res.json({ success: true, data });
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

// PATCH /customers/:id — ubah nama dan/atau nomor WhatsApp (Admin)
// no_wa string kosong = hapus nomor (no_wa boleh kosong)
const update = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new AppError('Pelanggan tidak ditemukan', 404);

  const { nama, no_wa } = req.body;
  if (nama !== undefined) customer.nama = nama;
  if (no_wa !== undefined) customer.no_wa = no_wa === '' ? undefined : no_wa;

  try {
    await customer.save();
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('Nomor WhatsApp sudah dipakai pelanggan lain', 409);
    }
    throw err;
  }

  res.json({ success: true, data: customer });
});

module.exports = { search, plates, orders, update };