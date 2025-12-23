import { state } from '../state.js';
import { router } from '../router.js';

export async function renderHome() {
  const content = document.getElementById('app-content');
  
  // Ensure products are loaded from database
  let products = state.getProducts();
  if (products.length === 0) {
    try {
      const { productsAPI } = await import('../api.js');
      products = await productsAPI.getAll();
      state.setProducts(products);
    } catch (error) {
      console.error('Failed to load products:', error);
      products = [];
    }
  }
  
  // Get featured products (first 3)
  const featuredProducts = products.slice(0, 3);

  content.innerHTML = `
    <section class="hero">
      <div class="hero-left">
        <h1>Discover Your Perfect <br /> Look</h1>
        <p>Premium beauty products from the world's most trusted brands</p>
        <button class="hero-btn" onclick="router.navigate('/product')">Shop Now</button>
      </div>
      <div class="hero-right">
        <img src="/assets/hero.png" alt="Beauty products" />
      </div>
    </section>

    <section class="featured">
      <h2 class="featured-title">Featured Products</h2>
      <div class="featured-grid">
        ${featuredProducts.map(product => `
          <div class="product-card">
            <span class="badge">New</span>
            <img src="${product.images?.[0] ? `/uploads/${product.images[0]}` : product.image || '/assets/product1.png'}" alt="${product.title || product.name}" />
            <h3>${product.title || product.name}</h3>
            <p class="brand">${product.brand || ''}</p>
            <p class="price">$${product.price?.toFixed(2) || '0.00'}</p>
            <button onclick="handleAddToCart('${product._id || product.id}')">Add to Cart</button>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

async function handleAddToCart(productId) {
  const products = state.getProducts();
  const product = products.find(p => (p._id || p.id) === productId);
  if (product) {
    state.addToCart(product);
    const { toast } = await import('../toast.js');
    toast.success('Product added to cart!');
  }
}

window.handleAddToCart = handleAddToCart;

