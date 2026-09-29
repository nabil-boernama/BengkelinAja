const { port } = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

(async () => {
  try {
    await connectDB();
    app.listen(port, () => console.log(`Server jalan di http://localhost:${port}`));
  } catch (err) {
    console.error('Gagal start server:', err.message);
    process.exit(1);
  }
})();
