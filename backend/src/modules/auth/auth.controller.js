const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../../config/env');
const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username: username.toLowerCase() }).select('+password_hash');
  const passwordOk = user ? await bcrypt.compare(password, user.password_hash) : false;

  // Pesan sengaja sama untuk semua kegagalan agar tidak membocorkan username yang valid
  if (!user || !passwordOk || !user.aktif) {
    throw new AppError('Username atau password salah', 401);
  }

  const token = jwt.sign({ sub: user.id, role: user.peran }, jwtSecret, { expiresIn: jwtExpiresIn });

  res.json({ success: true, data: { token, user } });
});

// JWT bersifat stateless: logout = client membuang token.
// Endpoint ini ada untuk kelengkapan kontrak API (FR-01).
const logout = (req, res) => {
  res.json({ success: true, message: 'Logout berhasil. Hapus token di sisi client.' });
};

const me = (req, res) => {
  res.json({ success: true, data: req.user });
};

module.exports = { login, logout, me };
