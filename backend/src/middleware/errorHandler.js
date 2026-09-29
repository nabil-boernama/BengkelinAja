const { ZodError } = require('zod');
const mongoose = require('mongoose');

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} tidak ditemukan` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ success: false, message: `Nilai ${err.path} tidak valid` });
  }
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).join(', ');
    return res.status(409).json({ success: false, message: `Data duplikat pada field: ${field}` });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).json({ success: false, message: err.message, errors: err.details });
  }

  console.error(err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
};

module.exports = { notFound, errorHandler };
