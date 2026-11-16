const Pusher = require('pusher');

const pusherConfig = {
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
};

const isConfigured = Object.values(pusherConfig).every(Boolean);
const pusher = isConfigured
  ? new Pusher({ ...pusherConfig, useTLS: true })
  : null;

if (!isConfigured) {
  console.warn('Pusher nonaktif: lengkapi PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, dan PUSHER_CLUSTER.');
}

function authorizeChannel(socketId, channelName) {
  if (!pusher) {
    const error = new Error('Pusher belum dikonfigurasi');
    error.status = 503;
    throw error;
  }
  return pusher.authorizeChannel(socketId, channelName);
}

async function publishOrderChanged() {
  if (!pusher) return;

  try {
    await pusher.trigger('private-orders', 'order.changed', {});
  } catch (err) {
    console.error('Pusher gagal mengirim perubahan order:', err.message);
  }
}

module.exports = { authorizeChannel, isConfigured, publishOrderChanged };
