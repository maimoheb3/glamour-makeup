import { state } from '../state.js';
import { router } from '../router.js';
import { ordersAPI } from '../api.js';

export function renderCheckout() {
  const content = document.getElementById('app-content');
  const cartItems = state.cartItems;
  const user = state.getUser();

  if (cartItems.length === 0) {
    router.navigate('/cart');
    return;
  }

  content.innerHTML = `
    <div class="checkout-page">
      <h2>Checkout</h2>
      <div class="checkout-container">
        <form class="checkout-form" id="checkout-form" onsubmit="handleCheckout(event)">
          <h3>Shipping Information</h3>
          <input type="text" name="name" placeholder="Full Name" value="${user?.name || ''}" required />
          <input type="email" name="email" placeholder="Email" value="${user?.email || ''}" required />
          <input type="text" name="address" placeholder="Address" required />
          <input type="text" name="city" placeholder="City" required />
          <input type="text" name="phone" placeholder="Phone Number" required />
          <button type="submit" class="place-order-btn">Place Order</button>
        </form>

        <div class="checkout-summary">
          <h3>Order Summary</h3>
          ${cartItems.map(item => `
            <div class="summary-item">
              <span>${item.name} × ${item.quantity}</span>
              <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
          <div class="summary-total">
            <strong>Total</strong>
            <strong>$${state.getTotalPrice().toFixed(2)}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function handleCheckout(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const user = state.getUser();

  if (!user || !user.id) {
    const { toast } = await import('../toast.js');
    toast.warning('Please login to place an order');
    router.navigate('/login');
    return;
  }

  // Ensure we have valid product IDs and format items correctly
  const items = state.cartItems.map(item => {
    const productId = item.id || item._id || item.productId;
    if (!productId) {
      console.error('Cart item missing ID:', item);
      throw new Error('Invalid cart item: missing product ID');
    }
    return {
      product: productId,
      quantity: parseInt(item.quantity) || 1,
      price: parseFloat(item.price) || 0,
    };
  });
  
  // Validate items array
  if (!items || items.length === 0) {
    const { toast } = await import('../toast.js');
    toast.error('Cart is empty');
    return;
  }
  
  const orderData = {
    userId: user.id || user._id,
    items: items,
    shippingAddress: `${formData.get('address')}, ${formData.get('city')}`,
    paymentMethod: 'cash',
    totalPrice: parseFloat(state.getTotalPrice()) || 0,
  };

  try {
    console.log('Creating order with data:', orderData);
    console.log('Items array:', items);
    console.log('Items is array:', Array.isArray(items));
    
    // Create order
    const order = await ordersAPI.create(orderData);
    console.log('Order created successfully:', order);
    
    // Checkout (process payment)
    const checkoutResult = await ordersAPI.checkout(order._id || order.id, 'cash');
    console.log('Checkout completed:', checkoutResult);

    // Save order and clear cart
    state.placeOrder({
      items: state.cartItems,
      total: state.getTotalPrice(),
      orderId: order._id || order.id,
    });

    // Navigate to confirmation with order ID
    router.navigate(`/order-confirmation?orderId=${order._id || order.id}`);
  } catch (error) {
    const { toast } = await import('../toast.js');
    console.error('Checkout error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    toast.error('Failed to place order: ' + (error.message || 'Unknown error'));
  }
}

window.handleCheckout = handleCheckout;

