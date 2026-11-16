const mongoose = require('mongoose');
const { Order, Customer, Part, OrderItem, OrderStatusLog, Counter, User } = require('../../models');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { publishOrderChanged } = require('../../utils/realtime');
const { ROLES, ORDER_STATUS } = require('../../constants');
const { dateKey } = require('../../utils/date');

// Urutan tahap yang dijalankan Mekanik. Transisi ke DIAMBIL khusus Admin (lihat updateStatus).
const MEKANIK_SEQUENCE = [
  ORDER_STATUS.ANTRE,
  ORDER_STATUS.DIPERIKSA,
  ORDER_STATUS.DIKERJAKAN,
  ORDER_STATUS.SELESAI,
];

// Status akhir: order tidak boleh diubah lagi
const FINAL_STATUS = [ORDER_STATUS.DIAMBIL, ORDER_STATUS.DIBATALKAN];

// Status yang masih boleh diubah datanya (pelanggan, plat, keluhan, mekanik)
const EDITABLE_STATUS = [ORDER_STATUS.ANTRE, ORDER_STATUS.DIPERIKSA, ORDER_STATUS.DIKERJAKAN];

// Sembunyikan sebagian nomor WA untuk Mekanik.
// Contoh: "08123456789" -> "0812****89"
const maskWA = (wa) => {
  if (!wa) return null;
  const s = String(wa);
  if (s.length <= 6) return '*'.repeat(s.length);
  return s.slice(0, 4) + '*'.repeat(s.length - 6) + s.slice(-2);
};

// POST /orders: buat order servis baru (FR-02)
const create = asyncHandler(async (req, res) => {
  const { customer: customerInput, plat, keluhan, mekanik: mekanikId } = req.body;

  const mekanik = await User.findOne({ _id: mekanikId, peran: ROLES.MEKANIK, aktif: true });
  if (!mekanik) throw new AppError('Mekanik tidak ditemukan atau tidak aktif', 400);

  let customer;
  if (customerInput.id) {
    customer = await Customer.findById(customerInput.id);
    if (!customer) throw new AppError('Pelanggan tidak ditemukan', 404);
    const digits = String(customer.no_wa || '').replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 13) {
      throw new AppError(
        'Nomor WhatsApp pelanggan harus berisi 8 sampai 13 digit. Perbarui data pelanggan terlebih dahulu.',
        400
      );
    }
  } else {
    const digits = customerInput.no_wa.replace(/\D/g, '');
    const formattedPhonePattern = new RegExp(
      `^\\+?${digits.split('').join('[\\s-]*')}$`
    );
    const duplicate = await Customer.exists({
      no_wa: { $regex: formattedPhonePattern },
    });
    if (duplicate) {
      throw new AppError('Nomor WhatsApp sudah terdaftar. Pilih pelanggan lama.', 409);
    }

    try {
      customer = await Customer.create({ nama: customerInput.nama, no_wa: digits });
    } catch (err) {
      if (err.code === 11000) {
        throw new AppError('Nomor WhatsApp sudah terdaftar. Pilih pelanggan lama.', 409);
      }
      throw err;
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

  await publishOrderChanged();
  res.status(201).json({ success: true, data: order });
});

// GET /orders?status=&plat=: daftar order (FR-12). Mekanik hanya lihat order miliknya.
const list = asyncHandler(async (req, res) => {
  const { status, plat, tanggal, aktif } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (plat) filter.plat = { $regex: String(plat).replace(/\s+/g, ''), $options: 'i' };
  if (tanggal) filter.tanggal_key = tanggal;
  if (req.user.peran === ROLES.MEKANIK) filter.mekanik = req.user._id;
  // Order aktif: status belum final (kapan pun), atau sudah Diambil/Dibatalkan tapi masih hari ini.
  // Order final dari hari sebelumnya hanya bisa diakses lewat riwayat pelanggan.
  if (aktif === '1') {
    filter.$or = [
      { status: { $nin: [ORDER_STATUS.DIAMBIL, ORDER_STATUS.DIBATALKAN] } },
      { tanggal_key: dateKey() },
    ];
  }

  const orders = await Order.find(filter)
    .sort({ tanggal_key: -1, no_antrean: -1 })
    .populate('customer', 'nama no_wa')
    .populate('mekanik', 'nama')
    .lean();

  // Mekanik hanya boleh lihat sebagian nomor WA pelanggan
  const data =
    req.user.peran === ROLES.MEKANIK
      ? orders.map((o) => ({
          ...o,
          customer: o.customer
            ? { ...o.customer, no_wa: maskWA(o.customer.no_wa) }
            : o.customer,
        }))
      : orders;

  res.json({ success: true, data });
});

// GET /orders/:id: detail order, rincian suku cadang, dan total biaya (FR-07)
const detail = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer')
    .populate('mekanik', 'nama')
    .lean();
  if (!order) throw new AppError('Order tidak ditemukan', 404);

  if (req.user.peran === ROLES.MEKANIK && String(order.mekanik._id) !== String(req.user._id)) {
    throw new AppError('Anda tidak punya akses ke order ini', 403);
  }

  // Mekanik hanya boleh lihat sebagian nomor WA pelanggan
  if (req.user.peran === ROLES.MEKANIK && order.customer) {
    order.customer = { ...order.customer, no_wa: maskWA(order.customer.no_wa) };
  }

  const items = await OrderItem.find({ order: order._id }).populate('part', 'nama').lean();
  const rincian = items.map((it) => ({
    part_id: it.part?._id,
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

// PATCH /orders/:id/status: ubah status (FR-03). NFR-03: mekanik hanya order miliknya.
// NFR-08: setiap perubahan dicatat siapa dan kapan.
const updateStatus = asyncHandler(async (req, res) => {
  const { status: target } = req.body;

  if (target === ORDER_STATUS.DIBATALKAN) {
    throw new AppError('Pembatalan hanya bisa lewat endpoint pembatalan order', 400);
  }

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

  await publishOrderChanged();
  res.json({ success: true, data: order });
});

// PUT /orders/:id/service: catat/ubah suku cadang + biaya jasa + deskripsi jasa (FR-04).
// NFR-06: pencatatan suku cadang & pengurangan stok dalam satu transaksi atomik.
// Body berisi daftar LENGKAP suku cadang yang dipakai (bukan tambahan); endpoint ini
// menghitung selisih bersih dengan data lama lalu menyesuaikan stok.
// Boleh selama order belum Diambil atau Dibatalkan (termasuk saat Selesai, untuk koreksi).
// Harga satuan baris yang sudah tercatat dipertahankan; baris baru memakai harga saat ini.
const recordService = asyncHandler(async (req, res) => {
  const { items, biaya_jasa, deskripsi_jasa } = req.body;
  const orderId = req.params.id;

  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new AppError('Order tidak ditemukan', 404);
      if (FINAL_STATUS.includes(order.status)) {
        throw new AppError(
          'Order sudah diambil atau dibatalkan, suku cadang tidak bisa diubah lagi',
          400
        );
      }

      const existing = await OrderItem.find({ order: order._id }).session(session);
      const existingDocs = new Map(existing.map((it) => [String(it.part), it]));
      const incomingByPart = new Map(items.map((it) => [String(it.part), it.jumlah]));
      const allPartIds = new Set([...existingDocs.keys(), ...incomingByPart.keys()]);

      for (const partId of allPartIds) {
        const oldDoc = existingDocs.get(partId);
        const oldQty = oldDoc ? oldDoc.jumlah : 0;
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
          if (oldDoc) {
            // baris lama: ubah jumlah saja, harga satuan lama dipertahankan
            oldDoc.jumlah = newQty;
            await oldDoc.save({ session });
          } else {
            const part = await Part.findById(partId).session(session);
            if (!part) throw new AppError('Suku cadang tidak ditemukan', 404);
            await OrderItem.create(
              [{ order: order._id, part: partId, jumlah: newQty, harga_satuan: part.harga }],
              { session }
            );
          }
        } else if (oldDoc) {
          await OrderItem.deleteOne({ _id: oldDoc._id }, { session });
        }
      }

      order.biaya_jasa = biaya_jasa;
      if (deskripsi_jasa !== undefined) order.deskripsi_jasa = deskripsi_jasa;
      await order.save({ session });
      result = order;
    });
  } finally {
    session.endSession();
  }

  await publishOrderChanged();
  res.json({ success: true, data: result });
});

// PATCH /orders/:id: ubah detail order (pelanggan, no WA, plat, keluhan, mekanik). Admin saja.
// Hanya selama order masih Antre, Diperiksa, atau Dikerjakan. Setelah Selesai, Diambil,
// atau Dibatalkan, data order hanya bisa dilihat.
// Nama & no WA disimpan di dokumen Customer, jadi perubahannya berlaku untuk semua order
// milik pelanggan tersebut. Order dan pelanggan diubah dalam satu transaksi.
const updateDetails = asyncHandler(async (req, res) => {
  const { customer: customerInput, plat, keluhan, mekanik: mekanikId } = req.body;

  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw new AppError('Order tidak ditemukan', 404);

      if (!EDITABLE_STATUS.includes(order.status)) {
        throw new AppError(
          'Order yang sudah Selesai, Diambil, atau Dibatalkan tidak bisa diubah',
          400
        );
      }

      if (customerInput && (customerInput.nama !== undefined || customerInput.no_wa !== undefined)) {
        const customer = await Customer.findById(order.customer).session(session);
        if (!customer) throw new AppError('Pelanggan tidak ditemukan', 404);
        if (customerInput.nama !== undefined) customer.nama = customerInput.nama;
        if (customerInput.no_wa !== undefined) {
          customer.no_wa = customerInput.no_wa === '' ? undefined : customerInput.no_wa;
        }
        try {
          await customer.save({ session });
        } catch (err) {
          if (err.code === 11000) {
            throw new AppError('Nomor WhatsApp sudah dipakai pelanggan lain', 409);
          }
          throw err;
        }
      }

      if (mekanikId !== undefined && String(mekanikId) !== String(order.mekanik)) {
        const mekanik = await User.findOne({
          _id: mekanikId,
          peran: ROLES.MEKANIK,
          aktif: true,
        }).session(session);
        if (!mekanik) throw new AppError('Mekanik tidak ditemukan atau tidak aktif', 400);
        order.mekanik = mekanik._id;
      }

      if (plat !== undefined) order.plat = plat; // dinormalisasi oleh setter di model
      if (keluhan !== undefined) order.keluhan = keluhan;

      await order.save({ session });
      result = order;
    });
  } finally {
    session.endSession();
  }

  await result.populate([{ path: 'customer' }, { path: 'mekanik', select: 'nama' }]);
  await publishOrderChanged();
  res.json({ success: true, data: result });
});

// POST /orders/:id/cancel: batalkan order (hanya Antre atau Diperiksa). Admin saja.
// Stok suku cadang yang sudah tercatat dikembalikan dalam satu transaksi.
const cancel = asyncHandler(async (req, res) => {
  const { alasan } = req.body;

  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw new AppError('Order tidak ditemukan', 404);
      if (![ORDER_STATUS.ANTRE, ORDER_STATUS.DIPERIKSA].includes(order.status)) {
        throw new AppError('Order hanya bisa dibatalkan saat berstatus Antre atau Diperiksa', 400);
      }

      // kembalikan stok suku cadang yang sudah tercatat, lalu hapus rinciannya
      const items = await OrderItem.find({ order: order._id }).session(session);
      for (const it of items) {
        await Part.updateOne({ _id: it.part }, { $inc: { stok: it.jumlah } }, { session });
      }
      await OrderItem.deleteMany({ order: order._id }, { session });

      order.status = ORDER_STATUS.DIBATALKAN;
      order.alasan_batal = alasan;
      order.dibatalkan_pada = new Date();
      order.dibatalkan_oleh = req.user._id;
      await order.save({ session });

      await OrderStatusLog.create(
        [
          {
            order: order._id,
            status_baru: ORDER_STATUS.DIBATALKAN,
            diubah_oleh: req.user._id,
            alasan,
          },
        ],
        { session }
      );
      result = order;
    });
  } finally {
    session.endSession();
  }

  await publishOrderChanged();
  res.json({ success: true, data: result });
});

// POST /orders/:id/revert: kembalikan order Selesai ke Dikerjakan. Admin saja.
const revert = asyncHandler(async (req, res) => {
  const { alasan } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order tidak ditemukan', 404);
  if (order.status !== ORDER_STATUS.SELESAI) {
    throw new AppError('Hanya order berstatus Selesai yang bisa dikembalikan ke Dikerjakan', 400);
  }

  order.status = ORDER_STATUS.DIKERJAKAN;
  await order.save();

  await OrderStatusLog.create({
    order: order._id,
    status_baru: ORDER_STATUS.DIKERJAKAN,
    diubah_oleh: req.user._id,
    alasan,
  });

  await order.populate([{ path: 'customer' }, { path: 'mekanik', select: 'nama' }]);

  await publishOrderChanged();
  res.json({ success: true, data: order });
});

module.exports = { create, list, detail, updateStatus, recordService, updateDetails, cancel, revert };