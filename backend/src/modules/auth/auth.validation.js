const { z } = require('zod');

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username wajib diisi').max(50),
  password: z.string().min(1, 'Password wajib diisi').max(100),
});

module.exports = { loginSchema };
