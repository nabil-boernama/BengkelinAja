const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Verifikasi JWT (header Authorization: Bearer <token>), lalu muat user dari DB.
// Peran SELALU diambil dari database, bukan dari input client.
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Token tidak ditemukan', 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch (err) {
    throw new AppError('Token tidak valid atau kedaluwarsa', 401);
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.aktif) {
    throw new AppError('Akun tidak ditemukan atau nonaktif', 401);
  }

  req.user = user;
  next();
});

// Pembatas peran. Contoh: router.get('/', authenticate, authorize('Admin', 'Owner'), handler)
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError('Belum login', 401));
  if (!roles.includes(req.user.peran)) {
    return next(new AppError('Anda tidak punya akses ke resource ini', 403));
  }
  next();
};

module.exports = { authenticate, authorize };
