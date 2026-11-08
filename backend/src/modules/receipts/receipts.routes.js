const router = require('express').Router();
const PDFDocument = require('pdfkit');

const {
  Order,
  OrderItem,
} = require('../../models');

const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');

const { authenticate, authorize } = require('../../middleware/auth');
const { ROLES, ORDER_STATUS } = require('../../constants');

router.get(
  '/:id/receipt',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'nama no_wa')
      .populate('mekanik', 'nama');

    if (!order) {
      throw new AppError('Order tidak ditemukan', 404);
    }

    if (order.status !== ORDER_STATUS.DIAMBIL) {
      throw new AppError(
        'Struk hanya dapat dibuat setelah order berstatus "Diambil"',
        400
      );
    }

    const items = await OrderItem.find({ order: order._id })
      .populate('part', 'nama')
      .lean();

    const totalSukuCadang = items.reduce(
      (total, item) => total + item.jumlah * item.harga_satuan,
      0
    );

    const totalBiaya = order.biaya_jasa + totalSukuCadang;

    const doc = new PDFDocument({
      size: 'A5',
      margin: 40,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="struk-${order.no_antrean}.pdf"`
    );

    doc.pipe(res);

    doc.fontSize(18).text('BENGKELINAJA', { align: 'center' });
    doc.fontSize(10).text('Struk Servis Kendaraan', { align: 'center' });

    doc.moveDown();
    doc.text(`No. Antrean : ${order.no_antrean}`);
    doc.text(`Tanggal     : ${order.tanggal_key}`);
    doc.text(`Pelanggan   : ${order.customer.nama}`);
    doc.text(`No. WhatsApp: ${order.customer.no_wa}`);
    doc.text(`Plat Nomor  : ${order.plat}`);
    doc.text(`Mekanik     : ${order.mekanik.nama}`);

    doc.moveDown();
    doc.text('----------------------------------------');

    doc.fontSize(11).text('Rincian Servis');

    doc.moveDown(0.5);

    items.forEach((item) => {
      const subtotal = item.jumlah * item.harga_satuan;

      doc.text(
        `${item.part.nama} - ${item.jumlah} x Rp${item.harga_satuan.toLocaleString('id-ID')}`
      );

      doc.text(
        `Subtotal: Rp${subtotal.toLocaleString('id-ID')}`
      );

      doc.moveDown(0.3);
    });

    doc.text(
      `Biaya jasa: Rp${order.biaya_jasa.toLocaleString('id-ID')}`
    );

    doc.moveDown();
    doc.text('----------------------------------------');

    doc.fontSize(13).text(
      `TOTAL: Rp${totalBiaya.toLocaleString('id-ID')}`,
      { align: 'right' }
    );

    doc.moveDown(2);
    doc.fontSize(9).text(
      'Terima kasih telah menggunakan layanan BengkelinAja.',
      { align: 'center' }
    );

    doc.end();
  })
);

module.exports = router;