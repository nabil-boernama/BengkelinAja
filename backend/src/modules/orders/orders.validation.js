const { z } = require('zod');
const { ORDER_STATUS } = require('../../constants');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID tidak valid');
const statusValues = Object.values(ORDER_STATUS);
const plat = z
  .string()
  .trim()
  .max(15)
  .regex(/^[A-Z]{1,2}\s*\d{1,4}(?:\s*[A-Z]{1,3})?$/i, 'Format plat nomor tidak valid');
// Nomor WA: hanya angka, spasi, strip, dan "+" di depan; 8 sampai 13 digit
const isValidWa = (value) =>
  /^\+?[0-9\s-]+$/.test(value) &&
  value.replace(/\D/g, '').length >= 8 &&
  value.replace(/\D/g, '').length <= 13;
const WA_MESSAGE = 'Nomor WhatsApp harus berisi 8 sampai 13 digit';
const noWa = z
  .string()
  .trim()
  .refine(isValidWa, WA_MESSAGE)
  .transform((value) => value.replace(/\D/g, ''));

const createOrderSchema = z.object({
  // Pelanggan lama: { id }. Pelanggan baru: { nama, no_wa }.
  customer: z.union([
    z.object({ id: objectId }),
    z.object({
      nama: z.string().trim().min(1, 'Nama pelanggan wajib diisi').max(100),
      no_wa: noWa,
    }),
  ]),
  plat,
  keluhan: z.string().trim().min(1, 'Keluhan wajib diisi').max(500),
  mekanik: objectId,
});

const listOrdersQuerySchema = z.object({
  status: z.enum(statusValues).optional(),
  plat: z.string().trim().max(15).optional(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  // aktif=1: hanya order aktif (belum Diambil/Dibatalkan, atau Diambil/Dibatalkan hari ini)
  aktif: z.enum(['0', '1']).optional(),
});

const orderIdParamSchema = z.object({ id: objectId });

const updateStatusSchema = z.object({
  status: z.enum(statusValues),
});

const recordServiceSchema = z.object({
  items: z
    .array(
      z.object({
        part: objectId,
        jumlah: z.number().int().positive('Jumlah minimal 1'),
      })
    )
    .default([]),
  biaya_jasa: z.number().min(0),
  // opsional: bila tidak dikirim, deskripsi lama dipertahankan
  deskripsi_jasa: z.string().trim().max(500, 'Deskripsi jasa maksimal 500 karakter').optional(),
});

// PATCH /orders/:id: ubah detail order (minimal satu field)
const updateOrderSchema = z
  .object({
    // data pelanggan pada order ini (nama, no WA); string kosong no_wa berarti hapus nomor
    customer: z
      .object({
        nama: z.string().trim().min(1, 'Nama pelanggan wajib diisi').max(100).optional(),
        // maks 20 karakter (termasuk spasi/strip), 8-13 digit, disimpan sebagai digit saja
        no_wa: z
          .string()
          .trim()
          .max(20, 'Nomor WhatsApp tidak valid')
          .refine((value) => value === '' || isValidWa(value), WA_MESSAGE)
          .transform((value) => value.replace(/\D/g, ''))
          .optional(),
      })
      .optional(),
    // format plat Indonesia (mis. AB 1234 CD), minimal 3 karakter
    plat: plat.min(3, 'Plat nomor tidak valid').optional(),
    keluhan: z.string().trim().min(1, 'Keluhan wajib diisi').max(500).optional(),
    mekanik: objectId.optional(),
  })
  .refine(
    (d) =>
      d.plat !== undefined ||
      d.keluhan !== undefined ||
      d.mekanik !== undefined ||
      (d.customer && (d.customer.nama !== undefined || d.customer.no_wa !== undefined)),
    { message: 'Minimal satu field harus diisi' }
  );

// POST /orders/:id/cancel
const cancelOrderSchema = z.object({
  alasan: z.string().trim().min(1, 'Alasan pembatalan wajib diisi').max(300),
});

// POST /orders/:id/revert (alasan opsional)
const revertOrderSchema = z.object({
  alasan: z.string().trim().max(300).optional(),
});

module.exports = {
  createOrderSchema,
  listOrdersQuerySchema,
  orderIdParamSchema,
  updateStatusSchema,
  recordServiceSchema,
  updateOrderSchema,
  cancelOrderSchema,
  revertOrderSchema,
};