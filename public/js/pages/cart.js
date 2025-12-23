import { state } from '../state.js';
import { router } from '../router.js';

export function renderCart() {
  const content = document.getElementById('app-content');
  const cartItems = state.cartItems;

  if (cartItems.length === 0) {
    content.innerHTML = '<h2 class="cart-empty">Your cart is empty</h2>';
    return;
  }

  content.innerHTML = `
    <div class="cart-page">
      <h2>Shopping Cart</h2>
      ${cartItems.map(item => `
        <div class="cart-item">
          <img src="${item.image || '/assets/product1.png'}" alt="${item.name}" />
          <div class="cart-info">
            <h3>${item.name}</h3>
            <p>${item.brand || ''}</p>
            <p class="price">$${Number(item.price).toFixed(2)}</p>
          </div>
          <div class="cart-actions">
            <button onclick="handleDecreaseQty('${item.id}')">-</button>
            <span>${item.quantity}</span>
            <button onclick="handleIncreaseQty('${item.id}')">+</button>
            <button class="delete-btn" onclick="handleRemoveFromCart('${item.id}')">🗑️</button>
          </div>
        </div>
      `).join('')}
      <div class="cart-footer">
        <h3>Total: $${state.getTotalPrice().toFixed(2)}</h3>
        <button class="checkout-btn" onclick="router.navigate('/checkout')">Proceed to Checkout</button>
      </div>
    </div>
  `;
}

async function handleIncreaseQty(id) {
  state.increaseQty(id);
  // Refresh current route to maintain router state
  if (router.currentPath === '/cart') {
    renderCart();
  } else {
    await router.refresh();
  }
}

async function handleDecreaseQty(id) {
  state.decreaseQty(id);
  // Refresh current route to maintain router state
  if (router.currentPath === '/cart') {
    renderCart();
  } else {
    await router.refresh();
  }
}

async function handleRemoveFromCart(id) {
  // Use a better confirmation dialog
  const { toast } = await import('../toast.js');
  
  // Create a simple confirmation
  const confirmed = confirm('Remove this item from cart?');
  if (confirmed) {
    state.removeFromCart(id);
    toast.success('Item removed from cart');
    
    // Refresh current route to maintain router state
    if (router.currentPath === '/cart') {
      renderCart();
    } else {
      await router.refresh();
    }
  }
}

window.handleIncreaseQty = handleIncreaseQty;
window.handleDecreaseQty = handleDecreaseQty;
window.handleRemoveFromCart = handleRemoveFromCart;

