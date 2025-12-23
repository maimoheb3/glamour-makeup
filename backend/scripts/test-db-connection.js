// Simple DB connection tester using backend/config/db.js
require('dotenv').config();
const db = require('../config/db');

(async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('MONGO_URI not set. Copy backend/.env.example to backend/.env and fill in your URI.');
      process.exit(2);
    }
    await db.connect(uri);
    console.log('Successfully connected to MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message || err);
    process.exit(1);
  }
})();
