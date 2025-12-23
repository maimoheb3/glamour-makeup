const mongoose = require('mongoose');

const connect = async (uri) => {
  const mongoUri = uri || process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is not set');
  try {
    await mongoose.connect(mongoUri);
    console.log('DB connected');
    return mongoose.connection;
  } catch (err) {
    console.error('DB connection error:', err);
    throw err;
  }
};

module.exports = { connect };