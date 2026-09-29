const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const controller = require('./auth.controller');
const { loginSchema } = require('./auth.validation');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');

// Batasi percobaan login untuk mencegah brute-force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan login, coba lagi nanti' },
});

router.post('/login', loginLimiter, validate(loginSchema), controller.login);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.me);

module.exports = router;
