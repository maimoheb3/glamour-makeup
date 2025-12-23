import { state } from '../state.js';
import { router } from '../router.js';
import { brandsAPI, productsAPI } from '../api.js';

// Public Brands Listing Page - Shows all brands
export async function renderBrandsList() {
  const content = document.getElementById('app-content');
  
  try {
    // Load brands from database
    const brands = await brandsAPI.getAll();
    
    // Load products to count products per brand
    let products = state.getProducts();
    if (products.length === 0) {
      try {
        products = await productsAPI.getAll();
        state.setProducts(products);
      } catch (error) {
        console.error('Failed to load products:', error);
        products = [];
      }
    }
    
    // Count products per brand
    const brandProductCounts = {};
    products.forEach(product => {
      const brandName = product.brand || '';
      if (brandName) {
        brandProductCounts[brandName] = (brandProductCounts[brandName] || 0) + 1;
      }
    });
    
    if (brands.length === 0) {
      content.innerHTML = `
        <div class="brands-list-page">
          <h2>Our Brands</h2>
          <div class="empty-brands">
            <p>No brands available at the moment.</p>
            <button class="shop-btn" onclick="router.navigate('/product')">Browse Products</button>
          </div>
        </div>
      `;
      return;
    }
    
    content.innerHTML = `
      <div class="brands-list-page">
        <div class="brands-header">
          <h2>Our Brands</h2>
          <p class="brands-subtitle">Discover products from your favorite beauty brands</p>
        </div>
        
        <div class="brands-grid">
          ${brands.map(brand => {
            const productCount = brandProductCounts[brand.name] || 0;
            return `
              <div class="brand-card-public" onclick="viewBrandProducts('${brand.slug || brand.name.toLowerCase().replace(/\s+/g, '-')}')">
                ${brand.logo ? `<img src="${brand.logo}" alt="${brand.name}" class="brand-logo" />` : ''}
                <div class="brand-info">
                  <h3>${brand.name}</h3>
                  ${brand.description ? `<p class="brand-description">${brand.description}</p>` : ''}
                  <p class="brand-product-count">${productCount} ${productCount === 1 ? 'product' : 'products'}</p>
                </div>
                <button class="view-brand-btn">View Products →</button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="brands-list-page">
        <h2>Our Brands</h2>
        <div class="error">Failed to load brands: ${error.message}</div>
      </div>
    `;
    console.error('Brands loading error:', error);
  }
}

function viewBrandProducts(brandSlug) {
  router.navigate(`/brands/${brandSlug}`);
}

window.viewBrandProducts = viewBrandProducts;

