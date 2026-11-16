const mongoose = require('mongoose');
const { mongoUri } = require('./env');

let connectionPromise;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoose.connection.readyState === 2 && connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(mongoUri)
    .then(() => {
      console.log('MongoDB terhubung');
      return mongoose.connection;
    })
    .catch((err) => {
      connectionPromise = null;
      throw err;
    });

  return connectionPromise;
}

module.exports = connectDB;
