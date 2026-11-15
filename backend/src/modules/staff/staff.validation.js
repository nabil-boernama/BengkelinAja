const { z } = require('zod');
const { ROLES } = require('../../constants');

const objectIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID tidak valid'),
});

const nama = z.string().trim().min(1, 'Nama wajib diisi').max(100);
// Username disimpan huruf kecil (lihat model User); huruf, angka, titik, garis bawah, strip
const username = z
  .string()
  .trim()
  .min(3, 'Username minimal 3 karakter')
  .max(50, 'Username maksimal 50 karakter')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Username hanya boleh berisi huruf, angka, titik, garis bawah, atau strip')
  .transform((v) => v.toLowerCase());
const peran = z.enum(Object.values(ROLES), {
  errorMap: () => ({ message: 'Peran harus Admin, Mekanik, atau Owner' }),
});

// POST /staff
const createStaffSchema = z.object({
  nama,
  username,
  password: z.string().min(6, 'Password minimal 6 karakter').max(100),
  peran,
});

// PUT /staff/:id: password tidak bisa diubah lewat endpoint ini (field tak dikenal dibuang)
const updateStaffSchema = z
  .object({
    nama: nama.optional(),
    username: username.optional(),
    peran: peran.optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'Isi minimal satu field untuk diubah',
  });

module.exports = { objectIdParamSchema, createStaffSchema, updateStaffSchema };
