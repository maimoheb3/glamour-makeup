import { state } from '../state.js';
import { router } from '../router.js';
import { productsAPI, brandsAPI } from '../api.js';
import { toast } from '../toast.js';

export function renderAdminDashboard() {
  const content = document.getElementById('app-content');
  
  content.innerHTML = `
    <div class="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <div class="admin-cards">
        <a href="/admin/products" onclick="event.preventDefault(); router.navigate('/admin/products')" class="admin-card">
          <h3>Manage Products</h3>
          <p>Add, edit, delete products</p>
        </a>
        <a href="/admin/brands" onclick="event.preventDefault(); router.navigate('/admin/brands')" class="admin-card">
          <h3>Manage Brands</h3>
          <p>Add, edit, delete brands</p>
        </a>
      </div>
    </div>
  `;
}

export async function renderAdminProducts() {
  const content = document.getElementById('app-content');
  
  // Ensure products are loaded from database
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
  
  // Load brands from database for dropdown
  let brands = [];
  try {
    brands = await brandsAPI.getAll();
  } catch (error) {
    console.error('Failed to load brands:', error);
  }
  
  // Create brand dropdown options
  const brandOptions = brands.map(brand => 
    `<option value="${brand.name}">${brand.name}</option>`
  ).join('');
  
  content.innerHTML = `
    <div class="admin-products">
      <h2>Manage Products</h2>
      
      <form class="admin-form" id="product-form" onsubmit="handleProductSubmit(event)">
        <h3 id="form-title">Add New Product</h3>
        <input type="hidden" id="product-id" />
        <input type="text" id="product-name" placeholder="Product name" required />
        
        <div class="brand-input-group">
          <label for="product-brand-select">Brand:</label>
          <select id="product-brand-select" onchange="handleBrandSelectChange()">
            <option value="">-- Select Brand --</option>
            <option value="__new__">+ Add New Brand</option>
            ${brandOptions}
          </select>
          <input type="text" id="product-brand" placeholder="Or type brand name" style="display: none;" />
          <div id="new-brand-message" style="display: none; margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 5px;">
            <p style="margin: 0 0 10px 0;">This brand doesn't exist in the database.</p>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="add-brand-to-db" checked />
              <span>Add this brand to the database</span>
            </label>
          </div>
        </div>
        
        <input type="number" id="product-price" placeholder="Price" step="0.01" required />
        <input type="text" id="product-description" placeholder="Description" />
        <input type="number" id="product-stock" placeholder="Stock" />
        <input type="file" id="product-image" accept="image/*" />
        <button type="submit" id="submit-btn">Add Product</button>
        <button type="button" onclick="resetForm()" id="cancel-btn" style="display: none;">Cancel</button>
      </form>

      <div class="products-grid">
        ${products.map(product => `
          <div class="product-card">
            <img src="${product.images?.[0] ? `/uploads/${product.images[0]}` : '/assets/product1.png'}" alt="${product.title || product.name}" />
            <h3>${product.title || product.name}</h3>
            <p>${product.brand || ''}</p>
            <p>$${product.price}</p>
            <div class="admin-actions">
              <button onclick="handleEditProduct('${product._id || product.id}')">Edit</button>
              <button onclick="handleDeleteProduct('${product._id || product.id}')">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

let editingProductId = null;

async function handleProductSubmit(event) {
  event.preventDefault();
  const form = event.target;
  
  const brandSelect = document.getElementById('product-brand-select');
  const brandInput = document.getElementById('product-brand');
  const addBrandToDb = document.getElementById('add-brand-to-db');
  const imageInput = document.getElementById('product-image');
  
  // Get brand name from either select or input
  let brandName = '';
  if (brandSelect.value && brandSelect.value !== '__new__' && brandSelect.value !== '') {
    brandName = brandSelect.value;
  } else if (brandInput.value && brandInput.value.trim() !== '') {
    brandName = brandInput.value.trim();
    
    // If user wants to add brand to database
    if (addBrandToDb && addBrandToDb.checked) {
      try {
        // Create brand in database
        const newBrand = await brandsAPI.create({
          name: brandName,
          description: '',
        });
        toast.success(`Brand "${brandName}" has been added to the database!`);
      } catch (error) {
        console.error('Failed to create brand:', error);
        // Continue anyway - just use the brand name as string
      }
    }
  }
  
  // Get image file if selected
  const imageFile = imageInput.files && imageInput.files.length > 0 ? imageInput.files[0] : null;
  
  const productData = {
    title: document.getElementById('product-name').value,
    brand: brandName,
    price: parseFloat(document.getElementById('product-price').value),
    description: document.getElementById('product-description').value,
    stock: parseInt(document.getElementById('product-stock').value) || 0,
  };

  try {
    if (editingProductId) {
      // Update existing product
      await productsAPI.update(editingProductId, productData, imageFile);
    } else {
      // Create new product
      await productsAPI.create(productData, imageFile);
    }

    // Reload products from database
    const products = await productsAPI.getAll();
    state.setProducts(products);

    // Reset form
    resetForm();
    
    // Refresh navbar to update brand dropdown if brand was added
    const { renderNavbar } = await import('../navbar.js');
    await renderNavbar();
    
    toast.success('Product saved successfully!');
    
    // Re-render the page using router to maintain route state
    await router.refresh();
  } catch (error) {
    toast.error('Failed to save product: ' + error.message);
    console.error('Product save error:', error);
  }
}

function handleBrandSelectChange() {
  const brandSelect = document.getElementById('product-brand-select');
  const brandInput = document.getElementById('product-brand');
  const newBrandMessage = document.getElementById('new-brand-message');
  
  if (brandSelect.value === '__new__') {
    // Show input for new brand
    brandInput.style.display = 'block';
    brandInput.required = true;
    newBrandMessage.style.display = 'block';
    brandInput.value = '';
    brandInput.focus();
  } else if (brandSelect.value && brandSelect.value !== '') {
    // Hide input and message
    brandInput.style.display = 'none';
    brandInput.required = false;
    newBrandMessage.style.display = 'none';
    brandInput.value = '';
  } else {
    // No brand selected
    brandInput.style.display = 'none';
    brandInput.required = false;
    newBrandMessage.style.display = 'none';
    brandInput.value = '';
  }
}

window.handleBrandSelectChange = handleBrandSelectChange;

async function handleEditProduct(id) {
  const products = state.getProducts();
  const product = products.find(p => (p._id || p.id) === id);
  
  if (product) {
    editingProductId = id;
    document.getElementById('product-id').value = id;
    document.getElementById('product-name').value = product.title || product.name;
    
    // Set brand in select or input
    const brandSelect = document.getElementById('product-brand-select');
    const brandInput = document.getElementById('product-brand');
    const productBrand = product.brand || '';
    
    // Check if brand exists in dropdown
    const brandOption = Array.from(brandSelect.options).find(opt => opt.value === productBrand);
    if (brandOption) {
      brandSelect.value = productBrand;
      brandInput.style.display = 'none';
      document.getElementById('new-brand-message').style.display = 'none';
    } else if (productBrand) {
      // Brand not in database, show in input
      brandSelect.value = '__new__';
      brandInput.style.display = 'block';
      brandInput.value = productBrand;
      document.getElementById('new-brand-message').style.display = 'block';
    } else {
      brandSelect.value = '';
      brandInput.style.display = 'none';
      document.getElementById('new-brand-message').style.display = 'none';
    }
    
    document.getElementById('product-price').value = product.price || '';
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-stock').value = product.stock || '';
    document.getElementById('form-title').textContent = 'Edit Product';
    document.getElementById('submit-btn').textContent = 'Update Product';
    document.getElementById('cancel-btn').style.display = 'block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

async function handleDeleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  try {
    await productsAPI.delete(id);
    
    // Reload products from database
    try {
      const products = await productsAPI.getAll();
      state.setProducts(products);
    } catch (error) {
      console.error('Failed to reload products:', error);
    }
    
    toast.success('Product deleted successfully!');
    
    // Re-render the page using router to maintain route state
    await router.refresh();
  } catch (error) {
    toast.error('Failed to delete product: ' + error.message);
    console.error('Delete error:', error);
  }
}

function resetForm() {
  editingProductId = null;
  document.getElementById('product-form').reset();
  document.getElementById('form-title').textContent = 'Add New Product';
  document.getElementById('submit-btn').textContent = 'Add Product';
  document.getElementById('cancel-btn').style.display = 'none';
  
  // Reset file input explicitly
  const imageInput = document.getElementById('product-image');
  if (imageInput) {
    imageInput.value = '';
  }
  
  // Reset brand inputs
  const brandInput = document.getElementById('product-brand');
  const newBrandMessage = document.getElementById('new-brand-message');
  if (brandInput) {
    brandInput.style.display = 'none';
    brandInput.required = false;
  }
  if (newBrandMessage) {
    newBrandMessage.style.display = 'none';
  }
}

window.handleProductSubmit = handleProductSubmit;
window.handleEditProduct = handleEditProduct;
window.handleDeleteProduct = handleDeleteProduct;
window.resetForm = resetForm;

