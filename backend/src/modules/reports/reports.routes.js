const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const Order = require('../../models/Order');
const Part = require('../../models/Part');

const tanggalKeyFilter = (period) => {
  const now = new Date();
  let start;
  if (period === 'daily') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'weekly') {
    const day = now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return start;
};

router.get('/dashboard', authenticate, authorize('Admin', 'Owner'), async (req, res, next) => {
  try {
    const period = req.query.period || 'monthly';
    const start = tanggalKeyFilter(period);

    const orders = await Order.find({
      status: 'Diambil',
      updatedAt: { $gte: start },
    }).lean();

    const totalPendapatan = orders.reduce((sum, o) => sum + (o.total_harga || 0), 0);
    const totalOrder = orders.length;

    const parts = await Part.find().lean();
    const stokMenipis = parts.filter((p) => p.stok <= p.batas_minimum);

    res.json({
      success: true,
      data: {
        period,
        total_pendapatan: totalPendapatan,
        total_order: totalOrder,
        stok_menipis: stokMenipis,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
