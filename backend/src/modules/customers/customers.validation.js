const { z } = require('zod');

const searchQuerySchema = z.object({
  q: z.string().trim().max(50).optional(),
});

const objectIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID tidak valid'),
});

const updateCustomerSchema = z
  .object({
    nama: z.string().trim().min(1, 'Nama wajib diisi').max(100).optional(),
    // string kosong berarti hapus nomor
    no_wa: z
      .union([
        z.string().trim().regex(/^\+?[0-9\s-]{8,20}$/, 'Nomor WhatsApp tidak valid'),
        z.literal(''),
      ])
      .optional(),
  })
  .refine((d) => d.nama !== undefined || d.no_wa !== undefined, {
    message: 'Minimal satu field harus diisi',
  });

module.exports = { searchQuerySchema, objectIdParamSchema, updateCustomerSchema };