const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { ROLES } = require('../../constants');

const BCRYPT_ROUNDS = 10; // sama dengan seeder

// Username sudah dipakai akun lain? (excludeId: akun yang sedang diedit)
const usernameTaken = (username, excludeId) =>
  User.exists({ username, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });

// Jumlah Owner aktif selain akun tertentu, supaya sistem tidak kehilangan Owner terakhir
const otherActiveOwners = (excludeId) =>
  User.countDocuments({ peran: ROLES.OWNER, aktif: true, _id: { $ne: excludeId } });

// GET /staff: daftar semua staf (Admin, Mekanik, Owner)
const list = asyncHandler(async (req, res) => {
  const data = await User.find().sort({ peran: 1, nama: 1 });
  res.json({ success: true, data });
});

// POST /staff: tambah staf baru, password di-hash dengan bcrypt
const create = asyncHandler(async (req, res) => {
  const { nama, username, password, peran } = req.body;

  if (await usernameTaken(username)) {
    throw new AppError('Username sudah dipakai', 409);
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  let user;
  try {
    user = await User.create({ nama, username, password_hash, peran, aktif: true });
  } catch (err) {
    if (err.code === 11000) throw new AppError('Username sudah dipakai', 409);
    throw err;
  }

  res.status(201).json({ success: true, data: user });
});

// PUT /staff/:id: ubah nama, username, atau peran. Password tidak diubah di sini.
const update = asyncHandler(async (req, res) => {
  const { nama, username, peran } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('Staf tidak ditemukan', 404);

  if (username !== undefined && username !== user.username && (await usernameTaken(username, user._id))) {
    throw new AppError('Username sudah dipakai', 409);
  }

  // Jangan sampai Owner aktif terakhir diturunkan perannya
  if (
    peran !== undefined &&
    peran !== ROLES.OWNER &&
    user.peran === ROLES.OWNER &&
    user.aktif &&
    (await otherActiveOwners(user._id)) === 0
  ) {
    throw new AppError('Harus ada minimal satu Owner aktif', 400);
  }

  if (nama !== undefined) user.nama = nama;
  if (username !== undefined) user.username = username;
  if (peran !== undefined) user.peran = peran;

  try {
    await user.save();
  } catch (err) {
    if (err.code === 11000) throw new AppError('Username sudah dipakai', 409);
    throw err;
  }

  res.json({ success: true, data: user });
});

// PATCH /staff/:id/toggle-aktif: aktifkan atau nonaktifkan akun.
// Akun nonaktif tidak bisa login dan token lamanya langsung ditolak (lihat middleware auth).
const toggleAktif = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('Staf tidak ditemukan', 404);

  if (user.aktif) {
    if (String(user._id) === String(req.user._id)) {
      throw new AppError('Anda tidak bisa menonaktifkan akun sendiri', 400);
    }
    if (user.peran === ROLES.OWNER && (await otherActiveOwners(user._id)) === 0) {
      throw new AppError('Harus ada minimal satu Owner aktif', 400);
    }
  }

  user.aktif = !user.aktif;
  await user.save();

  res.json({ success: true, data: user });
});

module.exports = { list, create, update, toggleAktif };
