import { state } from '../state.js';
import { router } from '../router.js';
import { ordersAPI } from '../api.js';

// Order History Page - Shows user's orders from database
export async function renderOrders() {
  const content = document.getElementById('app-content');
  const user = state.getUser();
  
  if (!user) {
    router.navigate('/login');
    return;
  }
  
  try {
    // Fetch user's orders from database
    const orders = await ordersAPI.getAll(user.id || user._id);
    
    if (orders.length === 0) {
      content.innerHTML = `
        <div class="orders-page">
          <h2>My Orders</h2>
          <div class="empty-orders">
            <p>You haven't placed any orders yet.</p>
            <button class="shop-btn" onclick="router.navigate('/product')">Start Shopping</button>
          </div>
        </div>
      `;
      return;
    }
    
    content.innerHTML = `
      <div class="orders-page">
        <h2>My Orders</h2>
        <div class="orders-list">
          ${orders.map(order => {
            const orderDate = new Date(order.createdAt || order.created_at).toLocaleDateString();
            const statusClass = order.status === 'completed' ? 'completed' : 
                               order.status === 'paid' ? 'paid' : 
                               order.status === 'shipped' ? 'shipped' : 'pending';
            
            return `
              <div class="order-card">
                <div class="order-header">
                  <div>
                    <h3>Order #${order._id || order.id}</h3>
                    <p class="order-date">Placed on ${orderDate}</p>
                  </div>
                  <div class="order-status ${statusClass}">
                    ${order.status || 'created'}
                  </div>
                </div>
                
                <div class="order-items">
                  ${order.items.map(item => `
                    <div class="order-item">
                      <img src="${item.product?.images?.[0] ? `/uploads/${item.product.images[0]}` : item.product?.image || '/assets/product1.png'}" 
                           alt="${item.product?.title || item.product?.name || 'Product'}" />
                      <div class="item-details">
                        <h4>${item.product?.title || item.product?.name || 'Product'}</h4>
                        <p>Quantity: ${item.quantity}</p>
                        <p class="item-price">$${item.price.toFixed(2)} each</p>
                      </div>
                      <div class="item-total">
                        $${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  `).join('')}
                </div>
                
                <div class="order-footer">
                  <div class="order-total">
                    <strong>Total: $${order.totalPrice.toFixed(2)}</strong>
                  </div>
                  <div class="order-info">
                    ${order.shippingAddress ? `<p><strong>Shipping:</strong> ${order.shippingAddress}</p>` : ''}
                    ${order.paymentMethod ? `<p><strong>Payment:</strong> ${order.paymentMethod}</p>` : ''}
                  </div>
                  <button class="view-order-btn" onclick="viewOrderDetails('${order._id || order.id}')">
                    View Details
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="orders-page">
        <h2>My Orders</h2>
        <div class="error">Failed to load orders: ${error.message}</div>
      </div>
    `;
    console.error('Orders loading error:', error);
  }
}

async function viewOrderDetails(orderId) {
  try {
    const order = await ordersAPI.getById(orderId);
    router.navigate(`/order-confirmation?orderId=${orderId}`);
  } catch (error) {
    const { toast } = await import('../toast.js');
    toast.error('Failed to load order details: ' + error.message);
    console.error('Order details error:', error);
  }
}

window.viewOrderDetails = viewOrderDetails;

