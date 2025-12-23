import { state } from './state.js';
import { router } from './router.js';

export async function renderNavbar() {
  const navbar = document.getElementById('navbar');
  const user = state.getUser();
  const cartItems = state.cartItems;
  
  // Load brands from database for dropdown
  let brands = [];
  try {
    const { brandsAPI } = await import('./api.js');
    brands = await brandsAPI.getAll();
  } catch (error) {
    console.error('Failed to load brands:', error);
    // Fallback to default brands
    brands = [
      { name: 'Huda Beauty', slug: 'huda-beauty' },
      { name: 'e.l.f', slug: 'elf' },
      { name: 'Chanel', slug: 'chanel' },
      { name: 'Sephora', slug: 'sephora' },
    ];
  }
  
  const brandsDropdown = brands.map(brand => 
    `<button onclick="router.navigate('/brands/${brand.slug}')">${brand.name}</button>`
  ).join('');

  navbar.innerHTML = `
    <div class="navbar-logo">
      <a href="/" class="logo-link">GLAMOUR</a>
    </div>

    <nav class="navbar-links">
      <a href="/">Home</a>
      <a href="/product">Products</a>
      <a href="/brands">Brands</a>
      
      <div class="dropdown">
        <button class="dropdown-title" onclick="toggleDropdown()">Browse by Brand</button>
          <div class="dropdown-menu" id="brands-dropdown">
            ${brandsDropdown}
          </div>
      </div>

      <a href="/about">About</a>
      
      ${user && state.isAdmin() ? '<a href="/admin/dashboard" class="admin-link">Admin</a>' : ''}
    </nav>

    <div class="navbar-icons">
      ${!user ? `
        <button class="login-btn" onclick="router.navigate('/login')">Login</button>
      ` : `
        <button class="icon-btn" onclick="toggleSearch()">🔍</button>
        ${user.role === 'user' ? `<a href="/profile" class="icon-btn">👤</a>` : ''}
        ${user.role === 'user' ? `<a href="/orders" class="icon-btn" title="My Orders">📦</a>` : ''}
        ${state.isAdmin() ? `<a href="/admin/dashboard" class="icon-btn">⚙️</a>` : ''}
        <button class="logout-btn" onclick="handleLogout()">Logout</button>
      `}
      
      ${!user || user.role === 'user' ? `
        <button class="cart-icon" onclick="router.navigate('/cart')">
          🛒
          ${cartItems.length > 0 ? `<span>${cartItems.length}</span>` : ''}
        </button>
      ` : ''}
    </div>

    <div class="search-overlay" id="search-overlay" style="display: none;">
      <div class="search-box">
        <input type="text" placeholder="Search products..." id="search-input" />
        <button class="close-search" onclick="toggleSearch()">×</button>
        <div class="search-results" id="search-results"></div>
      </div>
    </div>
  `;

  // Setup search functionality
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  // Subscribe to cart changes
  state.subscribe('cart', () => {
    const cartBadge = navbar.querySelector('.cart-icon span');
    if (cartBadge) {
      cartBadge.textContent = state.cartItems.length;
      if (state.cartItems.length === 0) {
        cartBadge.remove();
      }
    }
  });
}

function toggleDropdown() {
  const dropdown = document.getElementById('brands-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

function toggleSearch() {
  const overlay = document.getElementById('search-overlay');
  if (overlay) {
    overlay.style.display = overlay.style.display === 'none' ? 'flex' : 'none';
    if (overlay.style.display === 'flex') {
      document.getElementById('search-input')?.focus();
    }
  }
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  const results = document.getElementById('search-results');
  const products = state.getProducts();

  if (!query) {
    results.innerHTML = '';
    return;
  }

  const filtered = products.filter(p => 
    (p.title || p.name || '').toLowerCase().includes(query) ||
    (p.brand || '').toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    results.innerHTML = '<p class="no-results">No products found</p>';
  } else {
    results.innerHTML = filtered.map(product => `
      <div class="search-item" onclick="router.navigate('/product'); toggleSearch();">
        <img src="${product.images?.[0] ? `/uploads/${product.images[0]}` : product.image || ''}" alt="${product.title || product.name}" />
        <div>
          <p>${product.title || product.name}</p>
          <span>$${product.price}</span>
        </div>
      </div>
    `).join('');
  }
}

async function handleLogout() {
  state.logout();
  router.navigate('/');
  await renderNavbar();
}

window.toggleDropdown = toggleDropdown;
window.toggleSearch = toggleSearch;
window.handleLogout = handleLogout;

