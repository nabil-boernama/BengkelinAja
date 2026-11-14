const Part = require('../../models/Part');
const OrderItem = require('../../models/OrderItem');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');

// GET /parts — daftar suku cadang, dengan penanda stok menipis (FR-05, FR-11)
const list = asyncHandler(async (req, res) => {
  const parts = await Part.find().sort({ nama: 1 }).lean();
  const data = parts.map((p) => ({ ...p, stok_menipis: p.stok <= p.batas_minimum }));
  res.json({ success: true, data });
});

// POST /parts — tambah jenis suku cadang baru (FR-11)
const create = asyncHandler(async (req, res) => {
  const part = await Part.create(req.body);
  res.status(201).json({ success: true, data: part });
});

// PATCH /parts/:id — ubah harga, stok, atau batas minimum (FR-11)
const update = asyncHandler(async (req, res) => {
  const part = await Part.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!part) throw new AppError('Suku cadang tidak ditemukan', 404);
  res.json({ success: true, data: part });
});

// DELETE /parts/:id — hapus suku cadang yang belum pernah dipakai di order (FR-11)
// Yang sudah pernah dipakai ditolak supaya riwayat servis tetap utuh.
const remove = asyncHandler(async (req, res) => {
  const part = await Part.findById(req.params.id);
  if (!part) throw new AppError('Suku cadang tidak ditemukan', 404);

  const dipakai = await OrderItem.exists({ part: part._id });
  if (dipakai) {
    throw new AppError(
      'Suku cadang sudah pernah dipakai di order dan tidak bisa dihapus',
      409
    );
  }

  await part.deleteOne();
  res.json({ success: true, data: { _id: part._id } });
});

module.exports = { list, create, update, remove };