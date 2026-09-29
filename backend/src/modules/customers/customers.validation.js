const { z } = require('zod');

const searchQuerySchema = z.object({
  q: z.string().trim().max(50).optional(),
});

const objectIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID tidak valid'),
});

module.exports = { searchQuerySchema, objectIdParamSchema };
