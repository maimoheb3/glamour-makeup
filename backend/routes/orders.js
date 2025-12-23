const express = require('express');
const router = express.Router();
const ordersCtrl = require('../controllers/orders');

// Middleware to ensure items is an array
const parseItemsMiddleware = (req, res, next) => {
  console.log('=== PARSE ITEMS MIDDLEWARE ===');
  console.log('req.body:', req.body);
  
  if (req.body && req.body.items !== undefined) {
    console.log('Items found in body');
    console.log('Items type:', typeof req.body.items);
    console.log('Items value:', req.body.items);
    console.log('Items is array:', Array.isArray(req.body.items));
    
    // If items is a string, parse it
    if (typeof req.body.items === 'string') {
      console.log('Items is a string, parsing...');
      try {
        let cleaned = req.body.items.trim();
        // Remove outer quotes if present
        if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
            (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
          cleaned = cleaned.slice(1, -1);
        }
        req.body.items = JSON.parse(cleaned);
        console.log('Parsed items:', req.body.items);
        console.log('Parsed is array:', Array.isArray(req.body.items));
      } catch (e) {
        console.error('Failed to parse items:', e);
        return res.status(400).json({ message: 'Invalid items format: ' + e.message });
      }
    }
    
    // Ensure it's an array
    if (!Array.isArray(req.body.items)) {
      console.error('Items is not an array after parsing:', req.body.items);
      console.error('Type:', typeof req.body.items);
      return res.status(400).json({ message: 'Items must be an array. Received: ' + typeof req.body.items });
    }
    
    console.log('Items validated as array, length:', req.body.items.length);
  } else {
    console.log('No items found in body');
  }
  
  next();
};

router.post('/', parseItemsMiddleware, ordersCtrl.createOrder);
router.post('/checkout', ordersCtrl.checkout);
router.get('/', ordersCtrl.getOrders);
router.get('/:id', ordersCtrl.getOrderById);
router.put('/:id/status', ordersCtrl.updateOrderStatus);

module.exports = router;
