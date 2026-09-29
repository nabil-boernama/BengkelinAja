
const router = require('express').Router();

const { Order } = require('../../models');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');

const { authenticate, authorize } = require('../../middleware/auth');
const { ROLES } = require('../../constants');

router.get(
  '/:id/notify-link',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MEKANIK),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'nama no_wa')
      .populate('mekanik', 'nama');

    if (!order) {
      throw new AppError('Order tidak ditemukan', 404);
    }

    if (!order.customer?.no_wa) {
      throw new AppError('Nomor WhatsApp pelanggan tidak tersedia', 400);
    }

    const phone = String(order.customer.no_wa).replace(/\D/g, '');

    const message =
      `Halo ${order.customer.nama}, ` +
      `pesanan servis dengan nomor antrean ${order.no_antrean} ` +
      `saat ini berstatus "${order.status}".`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    res.json({
      success: true,
      data: {
        url,
      },
    });
  })
);


module.exports = router;
