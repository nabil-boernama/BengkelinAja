const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const Order = require('../../models/Order');
const OrderItem = require('../../models/OrderItem');
const Part = require('../../models/Part');

// WIB = UTC+7 (tanpa daylight saving). Kita hitung awal periode berdasarkan tanggal di WIB,
// supaya hasilnya sama di laptop maupun di server yang berjam UTC.
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

const startOfPeriodWIB = (period) => {
  // Geser jam sekarang ke WIB, lalu baca tanggalnya dengan getUTC*
  const nowWIB = new Date(Date.now() + WIB_OFFSET_MS);
  const y = nowWIB.getUTCFullYear();
  const m = nowWIB.getUTCMonth();
  const d = nowWIB.getUTCDate();

  let start;
  if (period === 'daily') {
    start = Date.UTC(y, m, d);
  } else if (period === 'weekly') {
    start = Date.UTC(y, m, d - nowWIB.getUTCDay()); // mulai hari Minggu
  } else {
    start = Date.UTC(y, m, 1);
  }
  // Kembalikan ke waktu sebenarnya (kurangi 7 jam)
  return new Date(start - WIB_OFFSET_MS);
};

router.get('/dashboard', authenticate, authorize('Owner'), async (req, res, next) => {
  try {
    const period = req.query.period || 'monthly';
    const start = startOfPeriodWIB(period);

    const orders = await Order.find({
      status: 'Diambil',
      updatedAt: { $gte: start },
    }).lean();

    // Pendapatan = biaya jasa + (jumlah x harga) semua suku cadang di order yang sudah diambil
    const items = await OrderItem.find({ order: { $in: orders.map((o) => o._id) } }).lean();
    const totalSukuCadang = items.reduce((sum, it) => sum + it.jumlah * it.harga_satuan, 0);
    const totalJasa = orders.reduce((sum, o) => sum + (o.biaya_jasa || 0), 0);
    const totalPendapatan = totalJasa + totalSukuCadang;
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