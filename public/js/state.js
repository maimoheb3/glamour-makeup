// Global State Management
class AppState {
  constructor() {
    this.user = null;
    this.products = [];
    this.cartItems = [];
    this.lastOrder = null;
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

  // Notify listeners
  notify(event) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback());
    }
  }

  // User Management
  setUser(user) {
    // If switching users, clear the old user's cart from localStorage
    const currentUserId = this.user?.id || this.user?._id;
    const newUserId = user?.id || user?._id;
    
    if (currentUserId && currentUserId !== newUserId) {
      // Different user - clear old user's cart from localStorage
      localStorage.removeItem(`cart_${currentUserId}`);
      this.cartItems = [];
    }
    
    this.user = user;
    if (user && user.token) {
      localStorage.setItem('token', user.token);
      localStorage.setItem('user', JSON.stringify(user));
      // Load user-specific cart after setting user
      this.loadCart();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.cartItems = [];
    }
    this.notify('user');
  }

  getUser() {
    if (!this.user) {
      const stored = localStorage.getItem('user');
      if (stored) {
        this.user = JSON.parse(stored);
      }
    }
    return this.user;
  }

  logout() {
    // Clear cart when logging out
    this.clearCart();
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart'); // Clear cart from localStorage
    localStorage.removeItem('lastOrder'); // Clear last order
    this.notify('user');
  }

  isAdmin() {
    return this.user && (this.user.isAdmin || this.user.role === 'admin');
  }

  // Products Management
  setProducts(products) {
    this.products = products;
    this.notify('products');
  }

  getProducts() {
    return this.products;
  }

  // Cart Management
  addToCart(product) {
    const existing = this.cartItems.find(item => item.id === product._id || item.id === product.id);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cartItems.push({
        id: product._id || product.id,
        name: product.title || product.name,
        price: product.price,
        image: product.images && product.images[0] ? `/uploads/${product.images[0]}` : product.image,
        brand: product.brand,
        quantity: 1,
      });
    }
    this.notify('cart');
    this.saveCart();
  }

  removeFromCart(id) {
    this.cartItems = this.cartItems.filter(item => item.id !== id);
    this.notify('cart');
    this.saveCart();
  }

  increaseQty(id) {
    const item = this.cartItems.find(item => item.id === id);
    if (item) {
      item.quantity += 1;
      this.notify('cart');
      this.saveCart();
    }
  }

  decreaseQty(id) {
    const item = this.cartItems.find(item => item.id === id);
    if (item && item.quantity > 1) {
      item.quantity -= 1;
      this.notify('cart');
      this.saveCart();
    }
  }

  getTotalPrice() {
    return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  clearCart() {
    this.cartItems = [];
    this.notify('cart');
    this.saveCart();
  }

  saveCart() {
    // Store cart with user ID to make it user-specific
    const userId = this.user?.id || this.user?._id;
    if (userId) {
      localStorage.setItem(`cart_${userId}`, JSON.stringify(this.cartItems));
    } else {
      // If no user, store in generic cart (for guest users)
      localStorage.setItem('cart', JSON.stringify(this.cartItems));
    }
  }

  loadCart() {
    const userId = this.user?.id || this.user?._id;
    let stored;
    
    if (userId) {
      // Load user-specific cart
      stored = localStorage.getItem(`cart_${userId}`);
    } else {
      // Load generic cart for guests
      stored = localStorage.getItem('cart');
    }
    
    if (stored) {
      try {
        this.cartItems = JSON.parse(stored);
        this.notify('cart');
      } catch (e) {
        console.error('Failed to parse cart:', e);
        this.cartItems = [];
      }
    } else {
      this.cartItems = [];
    }
  }

  placeOrder(orderData) {
    this.lastOrder = orderData;
    this.clearCart();
    localStorage.setItem('lastOrder', JSON.stringify(orderData));
  }

  getLastOrder() {
    if (!this.lastOrder) {
      const stored = localStorage.getItem('lastOrder');
      if (stored) {
        this.lastOrder = JSON.parse(stored);
      }
    }
    return this.lastOrder;
  }
}

// Export singleton instance
export const state = new AppState();

// Initialize cart from localStorage only if user exists
// This will be called after user is loaded in app.js
if (state.getUser()) {
  state.loadCart();
}

