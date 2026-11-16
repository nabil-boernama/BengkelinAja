const router = require('express').Router();
const PDFDocument = require('pdfkit');
const rateLimit = require('express-rate-limit');

const {
  Order,
  OrderItem,
} = require('../../models');

const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { formatPlat, formatRupiah } = require('../../utils/format');

const { authenticate, authorize } = require('../../middleware/auth');
const { ROLES, ORDER_STATUS } = require('../../constants');
const { fonnteToken } = require('../../config/env');
const validate = require('../../middleware/validate');
const { trackQuerySchema } = require('../tracking/tracking.validation');

const RECEIPT_AVAILABLE_STATUSES = [
  ORDER_STATUS.SELESAI,
  ORDER_STATUS.DIAMBIL,
];

const receiptLookupLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan struk. Silakan coba lagi nanti.',
  },
});

function assertReceiptAvailable(order, action) {
  if (!RECEIPT_AVAILABLE_STATUSES.includes(order.status)) {
    throw new AppError(
      `Struk hanya dapat ${action} setelah order berstatus "Selesai"`,
      400
    );
  }
}

async function getReceiptData(id, action = 'dibuat') {
  const order = await Order.findById(id)
    .populate('customer', 'nama no_wa')
    .populate('mekanik', 'nama');

  if (!order) {
    throw new AppError('Order tidak ditemukan', 404);
  }

  assertReceiptAvailable(order, action);

  const items = await OrderItem.find({ order: order._id })
    .populate('part', 'nama')
    .lean();

  return { order, items };
}

function buildReceiptPdf(order, items) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A5', margin: 40 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.once('end', () => resolve(Buffer.concat(chunks)));
    doc.once('error', reject);

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

    const biayaJasa = order.biaya_jasa || 0;
    const totalSukuCadang = items.reduce(
      (total, item) => total + item.jumlah * item.harga_satuan,
      0
    );
    const totalBiaya = biayaJasa + totalSukuCadang;

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
  });
}

function normalizeWhatsAppTarget(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('62')) return digits;
  return `62${digits}`;
}

function buildWhatsAppReceiptMessage(order, items) {
  const formatMessageRupiah = (amount) =>
    formatRupiah(amount).replace(/^Rp/, 'Rp ');
  const totalSukuCadang = items.reduce(
    (total, item) => total + item.jumlah * item.harga_satuan,
    0
  );
  const biayaJasa = order.biaya_jasa || 0;
  const totalBiaya = totalSukuCadang + biayaJasa;
  const rows = items.map((item) => ({
    label: `${item.part?.nama || 'Suku cadang'} x${item.jumlah}`,
    amount: formatMessageRupiah(item.jumlah * item.harga_satuan),
  }));
  rows.push({
    label: 'Jasa Servis',
    amount: formatMessageRupiah(biayaJasa),
  });
  const labelWidth = Math.max(
    12,
    ...rows.map(({ label }) => label.length)
  );
  const detailLines = rows.map(
    ({ label, amount }) => `${label.padEnd(labelWidth)} ${amount}`
  );
  const totalLine =
    `${'TOTAL'.padEnd(labelWidth)} ${formatMessageRupiah(totalBiaya)}`;
  const tanggal = order.tanggal
    ? new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      }).format(new Date(order.tanggal))
    : '-';
  const nomorAntrean = String(order.no_antrean).padStart(4, '0');

  return [
    '*STRUK SERVIS - BENGKELINAJA* 🔧',
    '',
    `Halo Kak *${order.customer?.nama || 'Pelanggan'}*! Kendaraan Anda sudah selesai diservis & siap diambil. 🎉`,
    '',
    '```',
    `Plat       : ${formatPlat(order.plat)}`,
    `Antrean    : #${nomorAntrean}`,
    `Tanggal    : ${tanggal}`,
    `Mekanik    : ${order.mekanik?.nama || '-'}`,
    '-------------------------',
    ...detailLines,
    '-------------------------',
    totalLine,
    '```',
    '',
    'Terima kasih telah mempercayakan servis kendaraan Anda kepada kami. Ditunggu kedatangannya! 🙏',
    '',
    '_BengkelinAja_',
  ].join('\n');
}

async function sendReceiptToFonnte({ target, message }) {
  if (!fonnteToken) {
    throw new AppError('FONNTE_TOKEN belum dikonfigurasi di backend', 503);
  }

  const form = new FormData();
  form.set('target', target);
  form.set('countryCode', '0');
  form.set('message', message);

  let response;
  try {
    response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: fonnteToken },
      body: form,
      signal: AbortSignal.timeout(20000),
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new AppError(
        'Waktu tunggu Fonnte habis. Periksa riwayat pengiriman sebelum mencoba lagi.',
        504
      );
    }
    throw new AppError('Tidak dapat terhubung ke Fonnte', 502);
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new AppError('Fonnte mengirim respons yang tidak valid', 502);
  }

  if (!response.ok || (result?.status !== true && result?.Status !== true)) {
    const reason = typeof result?.reason === 'string' ? `: ${result.reason}` : '';
    throw new AppError(`Fonnte gagal menerima struk${reason}`, 502);
  }

  return result;
}

router.get(
  '/receipt/lookup',
  receiptLookupLimiter,
  validate(trackQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { no_antrean, plat } = req.query;
    const normalizedPlat = String(plat).replace(/\s+/g, '').toUpperCase();
    const order = await Order.findOne({
      no_antrean,
      plat: normalizedPlat,
    })
      .sort({ tanggal_key: -1 })
      .populate('customer', 'nama')
      .populate('mekanik', 'nama');

    if (!order) {
      throw new AppError('Data servis tidak ditemukan', 404);
    }

    assertReceiptAvailable(order, 'dilihat');

    const items = await OrderItem.find({ order: order._id })
      .populate('part', 'nama')
      .lean();
    const pdf = await buildReceiptPdf(order, items);
    const filename = `struk-${order.no_antrean}-${order.tanggal_key}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);
    res.end(pdf);
  })
);

router.get(
  '/:id/receipt',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { order, items } = await getReceiptData(req.params.id);
    const pdf = await buildReceiptPdf(order, items);
    const filename = `struk-${order.no_antrean}-${order.tanggal_key}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);
    res.end(pdf);
  })
);

router.post(
  '/:id/receipt/send-whatsapp',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { order, items } = await getReceiptData(req.params.id, 'dikirim');
    if (order.status !== ORDER_STATUS.SELESAI) {
      throw new AppError(
        'Pesan WhatsApp hanya dapat dikirim saat order berstatus "Selesai"',
        400
      );
    }

    const target = normalizeWhatsAppTarget(order.customer?.no_wa);

    if (!target || !/^62\d{8,13}$/.test(target)) {
      throw new AppError('Nomor WhatsApp pelanggan tidak tersedia atau tidak valid', 400);
    }

    const message = buildWhatsAppReceiptMessage(order, items);

    await sendReceiptToFonnte({ target, message });

    res.json({
      success: true,
      data: { message: 'Permintaan pesan struk sudah diterima Fonnte.' },
    });
  })
);

module.exports = router;