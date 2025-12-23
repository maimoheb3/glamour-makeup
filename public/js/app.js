// Main Application Entry Point
import { router } from './router.js';
import { state } from './state.js';
import { authAPI, productsAPI } from './api.js';
import { toast } from './toast.js'; // Initialize toast early
import { renderHome } from './pages/home.js';
import { renderProducts } from './pages/products.js';
import { renderCart } from './pages/cart.js';
import { renderCheckout } from './pages/checkout.js';
import { renderLogin } from './pages/login.js';
import { renderSignup } from './pages/signup.js';
import { renderAdminDashboard, renderAdminProducts } from './pages/admin.js';
import { renderProfile } from './pages/profile.js';
import { renderBrands } from './pages/brands.js';
import { renderBrandsList } from './pages/brands-list.js';
import { renderOrders } from './pages/orders.js';
import { renderNavbar } from './navbar.js';
import { renderFooter } from './footer.js';

// Initialize app
async function init() {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (token) {
    try {
      // Try to get user info - you might need to decode JWT or call API
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        state.setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to restore user session:', error);
    }
  }

  // Load products
  try {
    const products = await productsAPI.getAll();
    state.setProducts(products);
  } catch (error) {
    console.error('Failed to load products:', error);
    // Use empty array if API fails
    state.setProducts([]);
  }

  // Render navbar and footer (navbar loads brands from database)
  await renderNavbar();
  renderFooter();

  // Setup routes
  router.route('/', async () => await renderHome());
  router.route('/product', async () => await renderProducts());
  router.route('/brands', async () => await renderBrandsList());
  router.route('/brands/:brandSlug', async (params) => await renderProducts(params.brandSlug));
  router.route('/cart', () => renderCart());
  router.route('/checkout', () => renderCheckout());
  router.route('/login', () => renderLogin());
  router.route('/signup', () => renderSignup());
  router.route('/admin/dashboard', () => {
    if (!state.isAdmin()) {
      router.navigate('/login');
      return;
    }
    renderAdminDashboard();
  });
  router.route('/admin/products', async () => {
    if (!state.isAdmin()) {
      router.navigate('/login');
      return;
    }
    await renderAdminProducts();
  });
  router.route('/admin/brands', async () => {
    if (!state.isAdmin()) {
      router.navigate('/login');
      return;
    }
    await renderBrands();
  });
  router.route('/profile', () => {
    if (!state.getUser()) {
      router.navigate('/login');
      return;
    }
    renderProfile();
  });
  router.route('/orders', async () => {
    if (!state.getUser()) {
      router.navigate('/login');
      return;
    }
    await renderOrders();
  });
  router.route('/order-confirmation', async () => {
    const lastOrder = state.getLastOrder();
    if (!lastOrder && !window.location.search.includes('orderId=')) {
      router.navigate('/');
      return;
    }
    // Get orderId from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    await renderOrderConfirmation(orderId);
  });

  // Handle initial route
  router.handleRoute();
}

// Order Confirmation Page - Enhanced to fetch from database
async function renderOrderConfirmation(orderId = null) {
  const content = document.getElementById('app-content');
  
  // Try to get order ID from state or URL
  let order = state.getLastOrder();
  let orderIdToFetch = orderId || order?.orderId;
  
  // If we have an order ID, fetch from database for complete details
  if (orderIdToFetch) {
    try {
      const { ordersAPI } = await import('./api.js');
      const dbOrder = await ordersAPI.getById(orderIdToFetch);
      order = {
        items: dbOrder.items.map(item => ({
          name: item.product?.title || item.product?.name || 'Product',
          quantity: item.quantity,
          price: item.price,
        })),
        total: dbOrder.totalPrice,
        orderId: dbOrder._id || dbOrder.id,
        status: dbOrder.status,
        shippingAddress: dbOrder.shippingAddress,
        paymentMethod: dbOrder.paymentMethod,
      };
    } catch (error) {
      console.error('Failed to fetch order from database:', error);
      // Fall back to state order if available
      if (!order) {
        content.innerHTML = '<div class="error">Order not found. Please check your order history.</div>';
        return;
      }
    }
  }
  
  if (!order) {
    content.innerHTML = '<div class="error">No order found. Please check your order history.</div>';
    return;
  }
  
  content.innerHTML = `
    <div class="order-confirmation-page">
      <div class="success-icon">✓</div>
      <h2>Thank you for your order!</h2>
      <p>Your payment was successful and your order is being prepared.</p>
      ${order.orderId ? `<p class="order-id">Order ID: ${order.orderId}</p>` : ''}
      ${order.status ? `<p class="order-status">Status: <strong>${order.status}</strong></p>` : ''}
      
      <div class="order-summary">
        <h3>Order Summary</h3>
        ${order.items.map(item => `
          <div class="summary-row">
            <span>${item.name} × ${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `).join('')}
        <div class="summary-total">
          <strong>Total Paid</strong>
          <strong>$${order.total.toFixed(2)}</strong>
        </div>
      </div>
      
      <div class="confirmation-actions">
        <button class="continue-btn" onclick="router.navigate('/')">Continue Shopping</button>
        <button class="orders-btn" onclick="router.navigate('/orders')">View My Orders</button>
      </div>
    </div>
  `;
}

// Make router available globally for onclick handlers
window.router = router;

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

