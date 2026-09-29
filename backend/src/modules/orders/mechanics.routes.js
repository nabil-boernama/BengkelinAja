const router = require('express').Router();
const User = require('../../models/User');
const Order = require('../../models/Order');
const asyncHandler = require('../../utils/asyncHandler');
const { authenticate, authorize } = require('../../middleware/auth');
const { ROLES, ORDER_STATUS } = require('../../constants');

// GET /mechanics/workload — jumlah order aktif tiap mekanik, untuk membantu Admin
// memilih mekanik saat membuat order (mendukung FR-02, menghindari motor menumpuk)
router.get(
  '/workload',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const mekaniks = await User.find({ peran: ROLES.MEKANIK, aktif: true })
      .select('nama')
      .lean();

    const counts = await Order.aggregate([
      { $match: { status: { $nin: [ORDER_STATUS.SELESAI, ORDER_STATUS.DIAMBIL] } } },
      { $group: { _id: '$mekanik', total: { $sum: 1 } } },
    ]);
    const countByMekanik = Object.fromEntries(counts.map((c) => [String(c._id), c.total]));

    const data = mekaniks.map((m) => ({
      id: m._id,
      nama: m.nama,
      order_aktif: countByMekanik[String(m._id)] || 0,
    }));

    res.json({ success: true, data });
  })
);

module.exports = router;
