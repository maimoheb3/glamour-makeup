const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Handle unhandled promise rejections to prevent server crash
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Note: In production, you might want to exit, but for development, we log and continue
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Note: In production, you might want to exit, but for development, we log and continue
});

const db = require('./config/db'); // DB singleton
const productRoutes = require('./routes/product');
const userRoutes = require('./routes/user');
const orderRoutes = require('./routes/orders');
const brandRoutes = require('./routes/brand');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  try {
    const app = express();
    app.use(cors());
    // JSON parser with strict: false to handle edge cases
    app.use(express.json({ 
      limit: '10mb',
      strict: false, // Allow non-object/array top-level JSON
      type: 'application/json'
    }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' })); // For form data (multipart/form-data handled by multer)

    // Try to connect to MongoDB, but don't block server startup
    if (MONGO_URI) {
      try {
        await db.connect(MONGO_URI);
        console.log('✅ MongoDB connected successfully');
      } catch (err) {
        console.warn('⚠️  MongoDB connection failed:', err.message);
        console.warn('⚠️  Server will start but database operations will fail');
        console.warn('⚠️  Please check your MONGO_URI in backend/.env file');
      }
    } else {
      console.warn('⚠️  MONGO_URI not set in environment variables');
      console.warn('⚠️  Server will start but database operations will fail');
      console.warn('⚠️  Please create backend/.env file with MONGO_URI');
    }

    // API routes
    app.use('/api/products', productRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/brands', brandRoutes);

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        message: 'Server is running',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      });
    });

    // Serve uploaded images first (before other static files)
    const uploadsPath = path.join(__dirname, 'public', 'uploads');
    if (fs.existsSync(uploadsPath)) {
      app.use('/uploads', express.static(uploadsPath));
    }
    
    // Serve static files from public directory
    const publicPath = path.join(__dirname, '..', 'public');
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
    }

    // Serve React build (production) if it exists
    const buildPath = path.join(__dirname, '..', 'build');
    if (fs.existsSync(buildPath)) {
      app.use(express.static(buildPath));
    }

    // SPA fallback - serve index.html for all non-API routes
    // Use a catch-all route that handles all non-API GET requests
    app.get(/^(?!\/api).*/, (req, res, next) => {
      // Try public/index.html first, then build/index.html
      const publicIndex = path.join(publicPath, 'index.html');
      const buildIndex = path.join(buildPath, 'index.html');
      
      if (fs.existsSync(publicIndex)) {
        return res.sendFile(publicIndex);
      } else if (fs.existsSync(buildIndex)) {
        return res.sendFile(buildIndex);
      }
      
      // If neither exists, send 404
      res.status(404).send('Frontend not found. Please ensure public/index.html exists.');
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (http://localhost:${PORT})`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

start();