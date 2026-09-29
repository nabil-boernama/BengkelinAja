const mongoose = require('mongoose');
const { Order, Customer, Part, OrderItem, OrderStatusLog, Counter, User } = require('../../models');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { ROLES, ORDER_STATUS } = require('../../constants');
const { dateKey } = require('../../utils/date');

// Urutan tahap yang dijalankan Mekanik. Transisi ke DIAMBIL khusus Admin (lihat updateStatus).
const MEKANIK_SEQUENCE = [
  ORDER_STATUS.ANTRE,
  ORDER_STATUS.DIPERIKSA,
  ORDER_STATUS.DIKERJAKAN,
  ORDER_STATUS.SELESAI,
];

// POST /orders — buat order servis baru (FR-02)
const create = asyncHandler(async (req, res) => {
  const { customer: customerInput, plat, keluhan, mekanik: mekanikId } = req.body;

  const mekanik = await User.findOne({ _id: mekanikId, peran: ROLES.MEKANIK, aktif: true });
  if (!mekanik) throw new AppError('Mekanik tidak ditemukan atau tidak aktif', 400);

  let customer;
  if (customerInput.id) {
    customer = await Customer.findById(customerInput.id);
    if (!customer) throw new AppError('Pelanggan tidak ditemukan', 404);
  } else {
    // Pelanggan baru: cek dulu berdasarkan no_wa (NFR-07: no_wa unik) sebelum membuat baru
    customer = customerInput.no_wa ? await Customer.findOne({ no_wa: customerInput.no_wa }) : null;
    if (!customer) {
      customer = await Customer.create({ nama: customerInput.nama, no_wa: customerInput.no_wa });
    }
  }

  // Nomor antrean harian, atomik lewat findOneAndUpdate $inc (aman dari race condition)
  const key = dateKey();
  const counter = await Counter.findOneAndUpdate(
    { _id: `antrean-${key}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  const order = await Order.create({
    no_antrean: counter.seq,
    tanggal_key: key,
    customer: customer._id,
    plat,
    keluhan,
    mekanik: mekanik._id,
    status: ORDER_STATUS.ANTRE,
  });

  await OrderStatusLog.create({
    order: order._id,
    status_baru: ORDER_STATUS.ANTRE,
    diubah_oleh: req.user._id,
  });

  await order.populate([{ path: 'customer' }, { path: 'mekanik', select: 'nama' }]);

  res.status(201).json({ success: true, data: order });
});

// GET /orders?status=&plat= — daftar order (FR-12). Mekanik hanya lihat order miliknya.
const list = asyncHandler(async (req, res) => {
  const { status, plat } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (plat) filter.plat = String(plat).replace(/\s+/g, '').toUpperCase();
  if (req.user.peran === ROLES.MEKANIK) filter.mekanik = req.user._id;

  const orders = await Order.find(filter)
    .sort({ tanggal_key: -1, no_antrean: -1 })
    .populate('customer', 'nama no_wa')
    .populate('mekanik', 'nama')
    .lean();

  res.json({ success: true, data: orders });
});

// GET /orders/:id — detail order, rincian suku cadang, dan total biaya (FR-07)
const detail = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer')
    .populate('mekanik', 'nama')
    .lean();
  if (!order) throw new AppError('Order tidak ditemukan', 404);

  if (req.user.peran === ROLES.MEKANIK && String(order.mekanik._id) !== String(req.user._id)) {
    throw new AppError('Anda tidak punya akses ke order ini', 403);
  }

  const items = await OrderItem.find({ order: order._id }).populate('part', 'nama').lean();
  const rincian = items.map((it) => ({
    part: it.part?.nama,
    jumlah: it.jumlah,
    harga_satuan: it.harga_satuan,
    subtotal: it.jumlah * it.harga_satuan,
  }));
  const totalSukuCadang = rincian.reduce((sum, it) => sum + it.subtotal, 0);

  res.json({
    success: true,
    data: { ...order, items: rincian, total_biaya: order.biaya_jasa + totalSukuCadang },
  });
});

// PATCH /orders/:id/status — ubah status (FR-03). NFR-03: mekanik hanya order miliknya.
// NFR-08: setiap perubahan dicatat siapa dan kapan.
const updateStatus = asyncHandler(async (req, res) => {
  const { status: target } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order tidak ditemukan', 404);

  if (req.user.peran === ROLES.MEKANIK) {
    if (String(order.mekanik) !== String(req.user._id)) {
      throw new AppError('Order ini bukan tugas Anda', 403);
    }
    const currentIdx = MEKANIK_SEQUENCE.indexOf(order.status);
    const targetIdx = MEKANIK_SEQUENCE.indexOf(target);
    if (currentIdx === -1 || targetIdx !== currentIdx + 1) {
      throw new AppError(`Status hanya bisa maju satu tahap. Saat ini "${order.status}"`, 400);
    }
  } else if (req.user.peran === ROLES.ADMIN) {
    const isPickup = order.status === ORDER_STATUS.SELESAI && target === ORDER_STATUS.DIAMBIL;
    if (!isPickup) {
      throw new AppError('Admin hanya bisa mengubah status "Selesai" menjadi "Diambil"', 400);
    }
  } else {
    throw new AppError('Anda tidak punya akses untuk mengubah status', 403);
  }

  order.status = target;
  await order.save();

  await OrderStatusLog.create({
    order: order._id,
    status_baru: target,
    diubah_oleh: req.user._id,
  });

  res.json({ success: true, data: order });
});

// PUT /orders/:id/service — catat/ubah suku cadang + biaya jasa (FR-04).
// NFR-06: pencatatan suku cadang & pengurangan stok dalam satu transaksi atomik.
// Body berisi daftar LENGKAP suku cadang yang dipakai (bukan tambahan); endpoint ini
// menghitung selisih dengan data lama lalu menyesuaikan stok.
const recordService = asyncHandler(async (req, res) => {
  const { items, biaya_jasa } = req.body;
  const orderId = req.params.id;

  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new AppError('Order tidak ditemukan', 404);
      if ([ORDER_STATUS.SELESAI, ORDER_STATUS.DIAMBIL].includes(order.status)) {
        throw new AppError('Order sudah selesai, suku cadang tidak bisa diubah lagi', 400);
      }

      const existing = await OrderItem.find({ order: order._id }).session(session);
      const existingByPart = new Map(existing.map((it) => [String(it.part), it.jumlah]));
      const incomingByPart = new Map(items.map((it) => [String(it.part), it.jumlah]));
      const allPartIds = new Set([...existingByPart.keys(), ...incomingByPart.keys()]);

      for (const partId of allPartIds) {
        const oldQty = existingByPart.get(partId) || 0;
        const newQty = incomingByPart.get(partId) || 0;
        const delta = newQty - oldQty; // positif = butuh stok tambahan, negatif = stok dikembalikan

        if (delta > 0) {
          const updated = await Part.findOneAndUpdate(
            { _id: partId, stok: { $gte: delta } },
            { $inc: { stok: -delta } },
            { new: true, session }
          );
          if (!updated) {
            const p = await Part.findById(partId).session(session);
            throw new AppError(`Stok "${p ? p.nama : 'suku cadang'}" tidak mencukupi`, 400);
          }
        } else if (delta < 0) {
          await Part.updateOne({ _id: partId }, { $inc: { stok: -delta } }, { session });
        }

        if (newQty > 0) {
          const part = await Part.findById(partId).session(session);
          if (!part) throw new AppError('Suku cadang tidak ditemukan', 404);
          await OrderItem.findOneAndUpdate(
            { order: order._id, part: partId },
            { jumlah: newQty, harga_satuan: part.harga },
            { upsert: true, session }
          );
        } else if (oldQty > 0) {
          await OrderItem.deleteOne({ order: order._id, part: partId }, { session });
        }
      }

      order.biaya_jasa = biaya_jasa;
      await order.save({ session });
      result = order;
    });
  } finally {
    session.endSession();
  }

  res.json({ success: true, data: result });
});

module.exports = { create, list, detail, updateStatus, recordService };
