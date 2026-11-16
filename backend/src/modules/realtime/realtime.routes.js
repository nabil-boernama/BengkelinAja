const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const AppError = require('../../utils/AppError');
const { ROLES } = require('../../constants');
const realtime = require('../../utils/realtime');

router.post(
  '/auth',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MEKANIK, ROLES.OWNER),
  (req, res, next) => {
    if (!realtime.isConfigured) {
      return next(new AppError('Pusher belum dikonfigurasi di backend', 503));
    }

    const { socket_id: socketId, channel_name: channelName } = req.body || {};
    if (
      typeof socketId !== 'string' ||
      !/^\d+\.\d+$/.test(socketId) ||
      typeof channelName !== 'string' ||
      channelName !== 'private-orders'
    ) {
      return next(new AppError('Data autentikasi channel tidak valid', 400));
    }

    try {
      return res.json(realtime.authorizeChannel(socketId, channelName));
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
