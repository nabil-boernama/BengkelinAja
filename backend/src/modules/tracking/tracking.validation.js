const { z } = require('zod');

const trackQuerySchema = z.object({
  no_antrean: z.coerce.number().int().positive('Nomor antrean tidak valid'),
  plat: z.string().trim().min(3, 'Plat nomor tidak valid').max(15),
});

module.exports = { trackQuerySchema };
