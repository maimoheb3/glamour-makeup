const { Order, OrderBuilder } = require('../models/order');
const Product = require('../models/product');

// Strategy implementations (simple, synchronous simulation)
class StripeStrategy {
  async pay(order) {
    // Simulated Stripe interaction
    return { id: 'stripe_tx_' + Date.now(), status: 'success', provider: 'stripe' };
  }
}

class PaypalStrategy {
  async pay(order) {
    return { id: 'paypal_tx_' + Date.now(), status: 'success', provider: 'paypal' };
  }
}

class CashStrategy {
  async pay(order) {
    return { id: 'cash_tx_' + Date.now(), status: 'pending', provider: 'cash-on-delivery' };
  }
}

function getPaymentStrategy(name) {
  switch ((name || '').toLowerCase()) {
    case 'stripe': return new StripeStrategy();
    case 'paypal': return new PaypalStrategy();
    case 'cash': return new CashStrategy();
    default: throw new Error('Unsupported payment method');
  }
}

exports.createOrder = async (req, res) => {
  try {
    // Log the incoming request body to debug
    console.log('=== ORDER CREATION DEBUG ===');
    console.log('Raw req.body:', req.body);
    console.log('Items type:', typeof req.body.items);
    console.log('Items value:', req.body.items);
    console.log('Items constructor:', req.body.items?.constructor?.name);
    
    const { userId, items, shippingAddress, paymentMethod, totalPrice } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    // Handle items - it might come as a string, array, or undefined
    let itemsArray = [];
    
    if (items === undefined || items === null) {
      return res.status(400).json({ message: 'Items are required' });
    }
    
    // If items is already an array, use it directly
    if (Array.isArray(items)) {
      itemsArray = items;
    } 
    // If items is a string, try to parse it
    else if (typeof items === 'string') {
      try {
        // Remove any extra quotes or brackets if present
        let cleanedString = items.trim();
        // If it starts with [ and ends with ], it's a JSON array string
        if (cleanedString.startsWith('[') && cleanedString.endsWith(']')) {
          itemsArray = JSON.parse(cleanedString);
        } else {
          // Try parsing as-is
          itemsArray = JSON.parse(cleanedString);
        }
      } catch (e) {
        console.error('Failed to parse items string:', e);
        console.error('Items string value:', items);
        return res.status(400).json({ message: 'Invalid items format: ' + e.message });
      }
    }
    // If items is an object (single item), wrap it in an array
    else if (typeof items === 'object' && items !== null) {
      itemsArray = [items];
    }
    else {
      console.error('Items is not a valid format:', items, 'Type:', typeof items);
      return res.status(400).json({ message: `Items must be an array. Received: ${typeof items}` });
    }
    
    if (!Array.isArray(itemsArray)) {
      console.error('Items is still not an array after processing:', itemsArray);
      return res.status(400).json({ message: 'Items must be an array' });
    }
    
    if (!itemsArray.length) {
      return res.status(400).json({ message: 'At least one item is required' });
    }
    
    console.log('Processed itemsArray:', itemsArray);
    console.log('ItemsArray is array:', Array.isArray(itemsArray));

    // Build order items array directly (skip builder to avoid any issues)
    const mongoose = require('mongoose');
    const orderItems = [];
    let calculatedTotal = 0;
    
    for (const it of itemsArray) {
      // validate product existence and price
      const productId = it.product || it.id;
      if (!productId) {
        return res.status(400).json({ message: 'Product ID is required for each item' });
      }
      
      const p = await Product.findById(productId);
      if (!p) return res.status(400).json({ message: `Product not found: ${productId}` });
      
      const quantity = parseInt(it.quantity) || 1;
      const price = parseFloat(it.price) || p.price;
      
      // Create order item object
      orderItems.push({
        product: productId, // Mongoose will convert string to ObjectId
        quantity: quantity,
        price: price,
      });
      
      calculatedTotal += quantity * price;
    }
    
    // Use provided totalPrice if available, otherwise use calculated one
    const finalTotalPrice = totalPrice ? parseFloat(totalPrice) : calculatedTotal;
    
    // Verify orderItems is an array
    if (!Array.isArray(orderItems)) {
      console.error('orderItems is not an array!', orderItems);
      return res.status(500).json({ message: 'Internal error: items must be an array' });
    }
    
    // Create order object directly - ensure items is a fresh array
    // Create a new array to avoid any reference issues
    const finalItems = orderItems.map(item => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
    }));
    
    const orderDataToSave = {
      user: mongoose.Types.ObjectId.isValid(userId) ? userId : new mongoose.Types.ObjectId(userId),
      items: finalItems, // Fresh array copy
      shippingAddress: shippingAddress || '',
      paymentMethod: paymentMethod || 'cash',
      totalPrice: finalTotalPrice,
      status: 'created',
    };
    
    // Final verification - items MUST be an array
    if (!Array.isArray(orderDataToSave.items)) {
      console.error('FINAL CHECK: items is still not an array!', orderDataToSave.items, typeof orderDataToSave.items);
      return res.status(500).json({ message: 'Internal error: items must be an array before creating Order' });
    }
    
    console.log('=== FINAL ORDER DATA ===');
    console.log('Order data to save (raw):', orderDataToSave);
    console.log('Order data to save (stringified):', JSON.stringify(orderDataToSave, null, 2));
    console.log('Items is array:', Array.isArray(orderDataToSave.items));
    console.log('Items instanceof Array:', orderDataToSave.items instanceof Array);
    console.log('Items constructor:', orderDataToSave.items.constructor.name);
    console.log('Items length:', orderDataToSave.items.length);
    console.log('Items type check:', Object.prototype.toString.call(orderDataToSave.items));

    // Ensure items is a plain array (not a Mongoose array) before creating Order
    // Convert to plain objects to avoid any Mongoose-specific issues
    // CRITICAL: Create a completely fresh array with plain objects
    const plainItems = [];
    for (const item of finalItems) {
      plainItems.push({
        product: String(item.product), // Ensure product ID is a string
        quantity: Number(item.quantity),
        price: Number(item.price),
      });
    }
    
    console.log('=== CREATING ORDER ===');
    console.log('plainItems:', plainItems);
    console.log('plainItems is array:', Array.isArray(plainItems));
    console.log('plainItems type:', typeof plainItems);
    console.log('plainItems constructor:', plainItems.constructor.name);
    console.log('plainItems JSON:', JSON.stringify(plainItems));
    
    // CRITICAL: Ensure items is definitely an array before passing to Order
    // Create a completely new array to avoid any reference issues
    const itemsForOrder = JSON.parse(JSON.stringify(plainItems));
    
    console.log('itemsForOrder:', itemsForOrder);
    console.log('itemsForOrder is array:', Array.isArray(itemsForOrder));
    console.log('itemsForOrder type:', typeof itemsForOrder);
    
    // Create order data object - ensure all fields are properly typed
    const orderDataForMongoose = {
      user: mongoose.Types.ObjectId.isValid(userId) ? userId : new mongoose.Types.ObjectId(userId),
      items: itemsForOrder, // Fresh array copy
      shippingAddress: String(shippingAddress || ''),
      paymentMethod: String(paymentMethod || 'cash'),
      totalPrice: Number(finalTotalPrice),
      status: String(orderDataToSave.status || 'created'),
    };
    
    // Final check - ensure items is an array
    if (!Array.isArray(orderDataForMongoose.items)) {
      console.error('CRITICAL: items is not an array before Order creation!');
      console.error('items value:', orderDataForMongoose.items);
      console.error('items type:', typeof orderDataForMongoose.items);
      return res.status(500).json({ message: 'Internal error: items must be an array' });
    }
    
    console.log('Order data for Mongoose:', JSON.stringify(orderDataForMongoose, null, 2));
    console.log('Items in orderData:', orderDataForMongoose.items);
    console.log('Items is array check:', Array.isArray(orderDataForMongoose.items));
    console.log('Items constructor:', orderDataForMongoose.items.constructor.name);
    
    // Use Order.create() instead of constructor to avoid casting issues
    // This method handles the casting more gracefully
    try {
      console.log('Using Order.create() with items:', itemsForOrder);
      console.log('Items is array before create:', Array.isArray(itemsForOrder));
      
      // Create order using create() method which handles casting better
      const order = await Order.create({
        user: orderDataForMongoose.user,
        items: itemsForOrder, // Fresh array
        shippingAddress: orderDataForMongoose.shippingAddress,
        paymentMethod: orderDataForMongoose.paymentMethod,
        totalPrice: orderDataForMongoose.totalPrice,
        status: orderDataForMongoose.status,
      });
      
      console.log('Order created successfully');
      console.log('Order.items:', order.items);
      console.log('Order.items is array:', Array.isArray(order.items));
      console.log('Order ID:', order._id);
      
      return res.status(201).json(order);
    } catch (err) {
      console.error('=== ORDER CREATION ERROR ===');
      console.error('Error:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      // Check if it's a validation error
      if (err.name === 'ValidationError') {
        console.error('Validation errors:', err.errors);
        return res.status(400).json({ 
          message: 'Order validation failed: ' + err.message,
          errors: err.errors 
        });
      }
      
      return res.status(400).json({ message: 'Failed to create order: ' + err.message });
    }
    return res.status(201).json(order);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.checkout = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    if (!orderId || !paymentMethod) return res.status(400).json({ message: 'orderId and paymentMethod are required' });

    const order = await Order.findById(orderId).populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const strategy = getPaymentStrategy(paymentMethod);
    const result = await strategy.pay(order);

    // persist payment result and update status
    order.paymentResult = result;
    order.paymentMethod = paymentMethod;
    if (result.status === 'success') order.status = 'paid';
    else if (result.status === 'pending') order.status = 'created';
    await order.save();

    return res.json({ order, payment: result });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    // If userId query param provided, filter by user
    const { userId } = req.query;
    const query = userId ? { user: userId } : {};
    
    const orders = await Order.find(query)
      .populate('user', '-password')
      .populate('items.product')
      .sort({ createdAt: -1 }); // Most recent first
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', '-password').populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.status = status;
    await order.save();
    return res.json(order);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
