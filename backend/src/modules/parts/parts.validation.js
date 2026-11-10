const { z } = require('zod');

const objectIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID tidak valid'),
});

const createPartSchema = z.object({
  nama: z.string().trim().min(1, 'Nama suku cadang wajib diisi').max(100),
  harga: z.number().min(0, 'Harga tidak boleh negatif'),
  stok: z.number().int().min(0).default(0),
  batas_minimum: z.number().int().min(0).default(0),
});

const updatePartSchema = z
  .object({
    nama: z.string().trim().min(1).max(100),
    harga: z.number().min(0),
    stok: z.number().int().min(0),
    batas_minimum: z.number().int().min(0),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Isi minimal satu field untuk diubah' });

module.exports = { objectIdParamSchema, createPartSchema, updatePartSchema };
