import { state } from '../state.js';
import { router } from '../router.js';
import { brandsAPI } from '../api.js';

export async function renderProducts(brandSlug = null) {
  const content = document.getElementById('app-content');
  const user = state.getUser();
  const isAdmin = state.isAdmin();
  
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
  
  let brandName = null;

  // Filter by brand if slug provided - fetch brand from database
  if (brandSlug) {
    try {
      const brand = await brandsAPI.getBySlug(brandSlug);
      brandName = brand.name;
      products = products.filter(p => 
        (p.brand || '').toLowerCase() === brandName.toLowerCase()
      );
    } catch (error) {
      console.error('Failed to load brand:', error);
      // Fallback to old method if brand not in database
      const brandSlugToName = {
        'huda-beauty': 'Huda Beauty',
        'elf': 'e.l.f',
        'chanel': 'Chanel',
        'sephora': 'Sephora',
        'tom-ford': 'Tom Ford',
      };
      brandName = brandSlugToName[brandSlug];
      if (brandName) {
        products = products.filter(p => 
          (p.brand || '').toLowerCase() === brandName.toLowerCase()
        );
      }
    }
  }

  content.innerHTML = `
    <div class="products-page">
      <h2 class="products-title">${brandName || (brandSlug ? brandSlug : 'Products')}</h2>
      <div class="products-grid">
        ${products.length === 0 ? '<p>No products found</p>' : products.map(product => `
          <div class="product-card">
            <img src="${product.images?.[0] ? `/uploads/${product.images[0]}` : product.image || '/assets/product1.png'}" alt="${product.title || product.name}" />
            <h3>${product.title || product.name}</h3>
            <p>$${product.price?.toFixed(2) || '0.00'}</p>
            ${!isAdmin ? `
              <button onclick="handleAddToCart('${product._id || product.id}')">Add to Cart</button>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
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

