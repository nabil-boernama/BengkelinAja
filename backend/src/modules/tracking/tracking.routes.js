const router = require('express').Router();
const rateLimit = require('express-rate-limit');

const { Order } = require('../../models');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');

const { trackQuerySchema } = require('./tracking.validation');

const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
  },
});

router.get(
  '/',
  trackLimiter,
  validate(trackQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { no_antrean, plat } = req.query;

    const normalizedPlat = String(plat)
      .replace(/\s+/g, '')
      .toUpperCase();

    const order = await Order.findOne({
      no_antrean,
      plat: normalizedPlat,
    }).populate('mekanik', 'nama');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Data servis tidak ditemukan',
      });
    }

    res.json({
      success: true,
      data: {
        status: order.status,
        tanggal: order.tanggal,
        mekanik: order.mekanik?.nama || null,
      },
    });
  })
);

module.exports = router;