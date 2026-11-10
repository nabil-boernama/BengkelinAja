const Part = require('../../models/Part');
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

module.exports = { list, create, update };
