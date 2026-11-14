const { z } = require('zod');
const { ORDER_STATUS } = require('../../constants');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID tidak valid');
const statusValues = Object.values(ORDER_STATUS);

const createOrderSchema = z.object({
  // Pelanggan lama: { id }. Pelanggan baru: { nama, no_wa? }.
  customer: z.union([
    z.object({ id: objectId }),
    z.object({
      nama: z.string().trim().min(1, 'Nama pelanggan wajib diisi').max(100),
      no_wa: z.string().trim().max(20).optional(),
    }),
  ]),
  plat: z.string().trim().min(3, 'Plat nomor tidak valid').max(15),
  keluhan: z.string().trim().min(1, 'Keluhan wajib diisi').max(500),
  mekanik: objectId,
});

const listOrdersQuerySchema = z.object({
  status: z.enum(statusValues).optional(),
  plat: z.string().trim().max(15).optional(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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
});

// PATCH /orders/:id: ubah detail order (minimal satu field)
const updateOrderSchema = z
  .object({
    plat: z.string().trim().min(3, 'Plat nomor tidak valid').max(15).optional(),
    keluhan: z.string().trim().min(1, 'Keluhan wajib diisi').max(500).optional(),
    mekanik: objectId.optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'Minimal satu field harus diisi',
  });

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