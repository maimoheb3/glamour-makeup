const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: { 
    type: [orderItemSchema], 
    required: true,
    // Custom setter to handle stringified arrays - runs when field is set
    set: function(v) {
      console.log('=== ITEMS SETTER (backup) ===');
      console.log('Input type:', typeof v);
      console.log('Input value:', v);
      
      if (Array.isArray(v)) {
        return v;
      }
      
      if (typeof v === 'string') {
        try {
          let cleaned = v.trim();
          if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
              (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
            cleaned = cleaned.slice(1, -1);
          }
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed)) {
            return parsed;
          }
          if (typeof parsed === 'object' && parsed !== null) {
            return [parsed];
          }
        } catch (e) {
          console.error('Setter failed to parse:', e);
          return [];
        }
      }
      
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        return [v];
      }
      
      return [];
    },
    validate: {
      validator: function(v) {
        const isArray = Array.isArray(v);
        if (!isArray) {
          console.error('Validation failed: items is not an array, type:', typeof v, 'value:', v);
        }
        return isArray;
      },
      message: 'Items must be an array'
    }
  },
  shippingAddress: { type: String },
  paymentMethod: { type: String },
  paymentResult: { type: Object },
  totalPrice: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['created','paid','shipped','completed','cancelled'], default: 'created' },
}, {
  timestamps: true,
});

// Pre-validate hook to catch issues BEFORE Mongoose tries to cast
// This runs before the setter validation, so we can fix stringified arrays here
orderSchema.pre('validate', function(next) {
  console.log('=== PRE-VALIDATE HOOK ===');
  console.log('this.items type:', typeof this.items);
  console.log('this.items value:', this.items);
  console.log('this.items is array:', Array.isArray(this.items));
  
  // If items is a string, parse it BEFORE Mongoose tries to cast
  if (typeof this.items === 'string') {
    console.log('Items is a string in pre-validate, parsing BEFORE casting...');
    try {
      let cleaned = this.items.trim();
      // Remove outer quotes if present
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
          (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1);
      }
      this.items = JSON.parse(cleaned);
      console.log('Parsed items in pre-validate:', this.items);
      console.log('Parsed is array:', Array.isArray(this.items));
    } catch (e) {
      console.error('Failed to parse items string in pre-validate:', e);
      return next(new Error('Invalid items format: ' + e.message));
    }
  }
  
  // Ensure items is an array
  if (!Array.isArray(this.items)) {
    console.error('Items is not an array in pre-validate:', this.items, typeof this.items);
    return next(new Error('Items must be an array. Received: ' + typeof this.items));
  }
  
  console.log('Items validated as array in pre-validate, length:', this.items.length);
  next();
});

// Pre-save hook to ensure items is always an array
orderSchema.pre('save', function(next) {
  console.log('=== PRE-SAVE HOOK ===');
  console.log('this.items type:', typeof this.items);
  console.log('this.items value:', this.items);
  console.log('this.items is array:', Array.isArray(this.items));
  console.log('this.items constructor:', this.items?.constructor?.name);
  
  // If items is a string, try to parse it
  if (typeof this.items === 'string') {
    console.log('Items is a string, parsing...');
    try {
      this.items = JSON.parse(this.items);
      console.log('Parsed items:', this.items);
      console.log('Parsed items is array:', Array.isArray(this.items));
    } catch (e) {
      console.error('Failed to parse items string:', e);
      return next(new Error('Invalid items format: ' + e.message));
    }
  }
  
  // Ensure items is an array
  if (!Array.isArray(this.items)) {
    console.error('Items is not an array after processing:', this.items, typeof this.items);
    return next(new Error('Items must be an array. Received: ' + typeof this.items));
  }
  
  console.log('Items validated as array, length:', this.items.length);
  next();
});

// Builder for creating Order objects incrementally
class OrderBuilder {
  constructor(userId) {
    this.order = { user: userId, items: [], totalPrice: 0, status: 'created' };
  }

  addItem(productId, quantity, price) {
    this.order.items.push({ product: productId, quantity, price });
    this.order.totalPrice += quantity * price;
    return this;
  }

  setShippingAddress(address) {
    this.order.shippingAddress = address;
    return this;
  }

  setPaymentMethod(method) {
    this.order.paymentMethod = method;
    return this;
  }

  setPaymentResult(result) {
    this.order.paymentResult = result;
    return this;
  }

  build() {
    return this.order;
  }
}

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
module.exports = { Order, OrderBuilder };

