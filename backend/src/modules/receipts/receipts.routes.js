const router = require('express').Router();
const PDFDocument = require('pdfkit');

const {
  Order,
  OrderItem,
} = require('../../models');

const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { formatPlat, formatRupiah } = require('../../utils/format');

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

    const biayaJasa = order.biaya_jasa || 0;
    const totalSukuCadang = items.reduce(
      (total, item) => total + item.jumlah * item.harga_satuan,
      0
    );
    const totalBiaya = biayaJasa + totalSukuCadang;

    const doc = new PDFDocument({ size: 'A5', margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="struk-${order.no_antrean}-${order.tanggal_key}.pdf"`
    );

    doc.pipe(res);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;

    const garis = () => {
      doc.moveDown(0.5);
      doc
        .moveTo(left, doc.y)
        .lineTo(right, doc.y)
        .lineWidth(0.5)
        .strokeColor('#999999')
        .stroke();
      doc.moveDown(0.5);
    };

    // Kepala struk
    doc.font('Helvetica-Bold').fontSize(18).text('BENGKELINAJA', { align: 'center' });
    doc.font('Helvetica').fontSize(10).text('Struk Servis Kendaraan', { align: 'center' });
    garis();

    // Data order: label | nilai
    const labelW = 90;
    const info = [
      ['No. Antrean', `#${order.no_antrean}`],
      ['Tanggal', order.tanggal_key],
      ['Pelanggan', order.customer?.nama || '-'],
      ['Kendaraan', formatPlat(order.plat)],
      ['Mekanik', order.mekanik?.nama || '-'],
    ];
    doc.fontSize(10);
    for (const [label, value] of info) {
      const y = doc.y;
      doc.font('Helvetica').text(label, left, y, { width: labelW });
      doc.font('Helvetica-Bold').text(`: ${value}`, left + labelW, y, { width: width - labelW });
    }
    garis();

    // Rincian suku cadang: nama | jml | harga satuan | subtotal
    const col = {
      nama: { x: left, w: width - 190 },
      jml: { x: left + width - 190, w: 30 },
      harga: { x: left + width - 155, w: 75 },
      subtotal: { x: left + width - 75, w: 75 },
    };
    const baris = (cells, font) => {
      doc.font(font).fontSize(9);
      const y = doc.y;
      const h = Math.max(...cells.map(([key, text]) => doc.heightOfString(text, { width: col[key].w })));
      for (const [key, text] of cells) {
        doc.text(text, col[key].x, y, { width: col[key].w, align: key === 'nama' ? 'left' : 'right' });
      }
      doc.x = left;
      doc.y = y + h + 4;
    };

    doc.font('Helvetica-Bold').fontSize(11).text('Rincian Suku Cadang', left);
    doc.moveDown(0.4);
    if (items.length === 0) {
      doc.font('Helvetica').fontSize(9).text('Tidak ada suku cadang.', left);
    } else {
      baris(
        [
          ['nama', 'Suku cadang'],
          ['jml', 'Jml'],
          ['harga', 'Harga satuan'],
          ['subtotal', 'Subtotal'],
        ],
        'Helvetica-Bold'
      );
      for (const item of items) {
        baris(
          [
            ['nama', item.part?.nama || 'Suku cadang dihapus'],
            ['jml', String(item.jumlah)],
            ['harga', formatRupiah(item.harga_satuan)],
            ['subtotal', formatRupiah(item.jumlah * item.harga_satuan)],
          ],
          'Helvetica'
        );
      }
    }
    garis();

    // Jasa servis
    doc.font('Helvetica-Bold').fontSize(11).text('Jasa Servis', left);
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(9).text(order.deskripsi_jasa || '-', left, doc.y, { width });
    doc.moveDown(0.6);

    const ringkas = (label, value, size, font) => {
      doc.font(font).fontSize(size);
      const y = doc.y;
      doc.text(label, left, y, { width: width / 2 });
      doc.text(value, left + width / 2, y, { width: width / 2, align: 'right' });
      doc.x = left;
    };
    ringkas('Total suku cadang', formatRupiah(totalSukuCadang), 10, 'Helvetica');
    ringkas('Biaya jasa', formatRupiah(biayaJasa), 10, 'Helvetica');
    garis();
    ringkas('TOTAL', formatRupiah(totalBiaya), 13, 'Helvetica-Bold');

    doc.moveDown(2);
    doc
      .font('Helvetica')
      .fontSize(9)
      .text('Terima kasih telah menggunakan layanan BengkelinAja.', left, doc.y, {
        width,
        align: 'center',
      });

    doc.end();
  })
);

module.exports = router;