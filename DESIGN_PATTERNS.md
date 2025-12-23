# Design Patterns Documentation

This document describes all design patterns implemented in the Glamour Makeup App project.

---

## Table of Contents

1. [Creational Patterns](#creational-patterns)
   - [Builder Pattern](#builder-pattern)
   - [Singleton Pattern](#singleton-pattern)
2. [Structural Patterns](#structural-patterns)
   - [Discriminator Pattern](#discriminator-pattern)
3. [Behavioral Patterns](#behavioral-patterns)
   - [Strategy Pattern](#strategy-pattern)
   - [Observer Pattern](#observer-pattern)
   - [Template Method Pattern](#template-method-pattern)
4. [Architectural Patterns](#architectural-patterns)
   - [MVC (Model-View-Controller)](#mvc-model-view-controller)
   - [Repository Pattern](#repository-pattern)
   - [Middleware Pattern](#middleware-pattern)

---

## Creational Patterns

### Builder Pattern

**Location:** `backend/models/order.js`

**Purpose:** Construct complex Order objects step by step, allowing for flexible order creation.

**Implementation:**
```javascript
class OrderBuilder {
  constructor(userId) {
    this.order = { user: userId, items: [], totalPrice: 0, status: 'created' };
  }

  addItem(productId, quantity, price) {
    this.order.items.push({ product: productId, quantity, price });
    this.order.totalPrice += quantity * price;
    return this; // Fluent interface
  }

  setShippingAddress(address) {
    this.order.shippingAddress = address;
    return this;
  }

  setPaymentMethod(method) {
    this.order.paymentMethod = method;
    return this;
  }

  build() {
    return this.order;
  }
}
```

**Usage:** `backend/controllers/orders.js`
```javascript
const builder = new OrderBuilder(userId);
for (const it of items) {
  const p = await Product.findById(it.product);
  builder.addItem(it.product, it.quantity || 1, p.price);
}
builder.setShippingAddress(shippingAddress).setPaymentMethod(paymentMethod);
const orderData = builder.build();
```

**Benefits:**
- Separates order construction from representation
- Allows step-by-step construction
- Provides fluent interface for method chaining
- Makes order creation more readable and maintainable

---

### Singleton Pattern

**Location:** `backend/config/db.js`, `public/js/state.js`

**Purpose:** Ensure only one instance of a class exists throughout the application lifecycle.

**Implementation:**

**Backend (Database Connection):**
```javascript
// db.js exports a singleton connection manager
const connect = async (uri) => {
  const mongoUri = uri || process.env.MONGO_URI;
  await mongoose.connect(mongoUri);
  return mongoose.connection; // Single connection instance
};

module.exports = { connect };
```

**Frontend (State Management):**
```javascript
class AppState {
  constructor() {
    this.user = null;
    this.products = [];
    this.cartItems = [];
    // ...
  }
}

// Export singleton instance
export const state = new AppState();
```

**Benefits:**
- Single source of truth for application state
- Prevents multiple database connections
- Global access point without global variables
- Memory efficient

---

## Structural Patterns

### Discriminator Pattern

**Location:** `backend/models/user.js`, `backend/models/admin.js`, `backend/models/customer.js`

**Purpose:** Implement inheritance in MongoDB using Mongoose discriminators, allowing different user types to share a base schema while having unique fields.

**Implementation:**

**Base User Model:**
```javascript
// user.js
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
});

class UserClass {
  async comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  }
}

userSchema.loadClass(UserClass);
const User = mongoose.model('User', userSchema);
```

**Admin Discriminator:**
```javascript
// admin.js
const User = require('./user');
const UserClass = User.UserClass;

class AdminClass extends UserClass {
  constructor(name, email, password, role = 'admin') {
    super(name, email, password);
    this.role = role;
    this.isAdmin = true;
  }

  promoteTo(role) {
    this.role = role;
  }
}

const adminSchema = new mongoose.Schema({
  role: { type: String, default: 'admin' },
});

adminSchema.loadClass(AdminClass);
const Admin = User.discriminator('Admin', adminSchema);
```

**Customer Discriminator:**
```javascript
// customer.js
class CustomerClass extends UserClass {
  constructor(name, email, password, loyaltyPoints = 0) {
    super(name, email, password);
    this.loyaltyPoints = loyaltyPoints;
  }

  addLoyalty(points) {
    this.loyaltyPoints = (this.loyaltyPoints || 0) + points;
  }
}

const customerSchema = new mongoose.Schema({
  loyaltyPoints: { type: Number, default: 0 },
});

customerSchema.loadClass(CustomerClass);
const Customer = User.discriminator('Customer', customerSchema);
```

**Benefits:**
- Code reuse through inheritance
- Polymorphism - treat all users uniformly
- Type safety with Mongoose discriminators
- Efficient database storage (single collection)
- Easy to extend with new user types

---

## Behavioral Patterns

### Strategy Pattern

**Location:** `backend/controllers/orders.js`

**Purpose:** Define a family of payment algorithms, encapsulate each one, and make them interchangeable.

**Implementation:**
```javascript
// Strategy interface
class StripeStrategy {
  async pay(order) {
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

// Strategy selector
function getPaymentStrategy(name) {
  switch ((name || '').toLowerCase()) {
    case 'stripe': return new StripeStrategy();
    case 'paypal': return new PaypalStrategy();
    case 'cash': return new CashStrategy();
    default: throw new Error('Unsupported payment method');
  }
}

// Usage in checkout
exports.checkout = async (req, res) => {
  const { orderId, paymentMethod } = req.body;
  const order = await Order.findById(orderId);
  
  const strategy = getPaymentStrategy(paymentMethod);
  const result = await strategy.pay(order);
  
  order.paymentResult = result;
  await order.save();
};
```

**Benefits:**
- Easy to add new payment methods
- Encapsulates payment logic
- Runtime strategy selection
- Follows Open/Closed Principle
- Testable in isolation

---

### Observer Pattern

**Location:** `public/js/state.js`

**Purpose:** Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.

**Implementation:**
```javascript
class AppState {
  constructor() {
    this.listeners = {
      user: [],
      products: [],
      cart: [],
    };
  }

  // Subscribe to state changes
  subscribe(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  // Notify all listeners
  notify(event) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback());
    }
  }

  // State changes trigger notifications
  setUser(user) {
    this.user = user;
    this.notify('user'); // Notify all user listeners
  }

  addToCart(product) {
    // ... add to cart logic
    this.notify('cart'); // Notify all cart listeners
  }
}
```

**Usage:**
```javascript
// Subscribe to cart changes
state.subscribe('cart', () => {
  updateCartUI();
  updateCartBadge();
});

// When cart changes, all subscribers are notified
state.addToCart(product);
```

**Benefits:**
- Loose coupling between state and UI
- Dynamic subscription/unsubscription
- Multiple observers can react to changes
- Follows Single Responsibility Principle

---

### Template Method Pattern

**Location:** `backend/models/user.js` (pre-save hooks)

**Purpose:** Define the skeleton of an algorithm in a base class, letting subclasses override specific steps.

**Implementation:**
```javascript
// Base schema with template method (pre-save hook)
userSchema.pre('save', async function (next) {
  // Template method: defines the algorithm structure
  if (!this.isModified('password')) return next();
  
  if (this.password && typeof this.password === 'string' && this.password.startsWith('$2')) {
    return next(); // Skip if already hashed
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Subclasses can override or extend
adminSchema.pre('save', function (next) {
  this.isAdmin = true; // Additional step
  next();
});
```

**Benefits:**
- Code reuse in algorithm structure
- Consistent behavior across subclasses
- Easy to modify algorithm steps
- Reduces code duplication

---

## Architectural Patterns

### MVC (Model-View-Controller)

**Location:** Entire backend structure

**Purpose:** Separate application logic into three interconnected components.

**Implementation:**

**Models:** `backend/models/`
- `user.js` - User data structure
- `product.js` - Product data structure
- `order.js` - Order data structure
- `admin.js`, `customer.js` - Specialized user models

**Views:** `public/` (Frontend)
- HTML templates in `public/index.html`
- CSS styling in `public/css/`
- JavaScript views in `public/js/pages/`

**Controllers:** `backend/controllers/`
- `users.js` - User business logic
- `product.js` - Product business logic
- `orders.js` - Order business logic

**Routes:** `backend/routes/`
- `user.js` - User endpoints
- `product.js` - Product endpoints
- `orders.js` - Order endpoints

**Flow:**
```
Request → Route → Controller → Model → Database
                ↓
Response ← View ← Controller ← Model
```

**Benefits:**
- Separation of concerns
- Easy to maintain and test
- Scalable architecture
- Clear code organization

---

### Repository Pattern

**Location:** `backend/controllers/` (implicit)

**Purpose:** Abstract data access logic, providing a more object-oriented view of the persistence layer.

**Implementation:**
```javascript
// Controllers act as repositories
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find(); // Data access abstraction
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save(); // Data persistence abstraction
    return res.status(201).json(product);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
```

**Benefits:**
- Centralizes data access logic
- Easy to swap data sources
- Testable with mock repositories
- Consistent data access interface

---

### Middleware Pattern

**Location:** `backend/middlewares/auth.js`, Express middleware chain

**Purpose:** Provide a way to add cross-cutting concerns (authentication, validation, logging) to request processing.

**Implementation:**
```javascript
// Authentication middleware
exports.protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token' });
  }
  
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    
    req.user = user; // Attach user to request
    next(); // Continue to next middleware/route handler
  } catch (err) {
    return res.status(401).json({ message: 'Token error' });
  }
};

// Admin authorization middleware
exports.admin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
};
```

**Usage:**
```javascript
// Apply middleware to routes
router.post('/products', protect, admin, productCtrl.createProduct);
router.get('/products', productCtrl.getProducts); // Public route
```

**Benefits:**
- Reusable authentication/authorization logic
- Clean separation of concerns
- Composable middleware chain
- Easy to add new middleware (logging, rate limiting, etc.)

---

## Additional Patterns

### Factory Pattern (Implicit)

**Location:** `backend/controllers/orders.js` - `getPaymentStrategy()`

**Purpose:** Create objects without specifying the exact class of object that will be created.

**Implementation:**
```javascript
function getPaymentStrategy(name) {
  switch ((name || '').toLowerCase()) {
    case 'stripe': return new StripeStrategy();
    case 'paypal': return new PaypalStrategy();
    case 'cash': return new CashStrategy();
    default: throw new Error('Unsupported payment method');
  }
}
```

**Benefits:**
- Encapsulates object creation
- Easy to extend with new strategies
- Centralized creation logic

---

### Facade Pattern (Implicit)

**Location:** `public/js/api.js`

**Purpose:** Provide a simplified interface to a complex subsystem (backend API).

**Implementation:**
```javascript
// Simplified API interface
export const authAPI = {
  async register(userData) {
    return apiCall('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  async login(email, password) {
    return apiCall('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
};
```

**Benefits:**
- Simplifies complex API interactions
- Hides implementation details
- Single point of change for API modifications

---

## Pattern Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Builder** | `backend/models/order.js` | Construct complex Order objects |
| **Singleton** | `backend/config/db.js`, `public/js/state.js` | Single instance of DB connection and app state |
| **Discriminator** | `backend/models/user.js`, `admin.js`, `customer.js` | User inheritance with MongoDB |
| **Strategy** | `backend/controllers/orders.js` | Interchangeable payment methods |
| **Observer** | `public/js/state.js` | State change notifications |
| **Template Method** | `backend/models/user.js` | Algorithm skeleton in pre-save hooks |
| **MVC** | Entire backend structure | Separation of concerns |
| **Repository** | `backend/controllers/` | Data access abstraction |
| **Middleware** | `backend/middlewares/auth.js` | Cross-cutting concerns |
| **Factory** | `backend/controllers/orders.js` | Payment strategy creation |
| **Facade** | `public/js/api.js` | Simplified API interface |

---

## Design Principles Applied

1. **SOLID Principles:**
   - **Single Responsibility:** Each controller handles one resource
   - **Open/Closed:** Strategy pattern allows extension without modification
   - **Liskov Substitution:** Admin and Customer can substitute User
   - **Interface Segregation:** Focused API endpoints
   - **Dependency Inversion:** Depend on abstractions (models, not implementations)

2. **DRY (Don't Repeat Yourself):**
   - Shared base User class
   - Reusable middleware
   - Common API call function

3. **Separation of Concerns:**
   - Models handle data
   - Controllers handle business logic
   - Routes handle HTTP concerns
   - Frontend handles presentation

---

## Conclusion

This application demonstrates a comprehensive use of design patterns to create a maintainable, scalable, and well-structured codebase. Each pattern serves a specific purpose and contributes to the overall architecture quality.

