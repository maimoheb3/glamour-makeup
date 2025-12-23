import { state } from '../state.js';
import { router } from '../router.js';
import { brandsAPI } from '../api.js';
import { productsAPI } from '../api.js';
import { toast } from '../toast.js';

// Brand management page (Admin)
export async function renderBrands() {
  const content = document.getElementById('app-content');
  const user = state.getUser();
  const isAdmin = state.isAdmin();

  if (!isAdmin) {
    content.innerHTML = '<h2>Access Denied</h2><p>Admin access required.</p>';
    return;
  }

  try {
    const brands = await brandsAPI.getAll();
    
    content.innerHTML = `
      <div class="brand-page">
        <h2 class="brand-title">Brand Management</h2>

        <form class="admin-form" id="brand-form" onsubmit="handleBrandSubmit(event)">
          <h3 id="form-title">Add New Brand</h3>
          <input type="hidden" id="brand-id" />
          <input type="text" id="brand-name" placeholder="Brand name" required />
          <input type="text" id="brand-description" placeholder="Description (optional)" />
          <input type="text" id="brand-logo" placeholder="Logo URL (optional)" />
          <button type="submit" id="submit-btn">Add Brand</button>
          <button type="button" onclick="resetBrandForm()" id="cancel-btn" style="display: none;">Cancel</button>
        </form>

        <div class="brand-grid">
          ${brands.length === 0 ? '<p>No brands found. Add your first brand!</p>' : brands.map(brand => `
            <div class="brand-card">
              <h3>${brand.name}</h3>
              ${brand.description ? `<p>${brand.description}</p>` : ''}
              <div class="admin-actions">
                <button onclick="handleEditBrand('${brand._id || brand.id}', '${brand.name}', '${brand.description || ''}', '${brand.logo || ''}')">Edit</button>
                <button onclick="handleDeleteBrand('${brand._id || brand.id}')">Delete</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<div class="error">Failed to load brands: ${error.message}</div>`;
    console.error('Brand loading error:', error);
  }
}

let editingBrandId = null;

async function handleBrandSubmit(event) {
  event.preventDefault();
  const form = event.target;
  
  const brandData = {
    name: document.getElementById('brand-name').value,
    description: document.getElementById('brand-description').value || undefined,
    logo: document.getElementById('brand-logo').value || undefined,
  };

  try {
    if (editingBrandId) {
      await brandsAPI.update(editingBrandId, brandData);
    } else {
      await brandsAPI.create(brandData);
    }

    // Refresh navbar to update brand dropdown
    const { renderNavbar } = await import('../navbar.js');
    await renderNavbar();
    
    toast.success('Brand saved successfully!');
    
    // Re-render the page using router to maintain route state
    await router.refresh();
  } catch (error) {
    toast.error('Failed to save brand: ' + error.message);
    console.error('Brand save error:', error);
  }
}

async function handleEditBrand(id, name, description, logo) {
  editingBrandId = id;
  document.getElementById('brand-id').value = id;
  document.getElementById('brand-name').value = name;
  document.getElementById('brand-description').value = description || '';
  document.getElementById('brand-logo').value = logo || '';
  document.getElementById('form-title').textContent = 'Edit Brand';
  document.getElementById('submit-btn').textContent = 'Update Brand';
  document.getElementById('cancel-btn').style.display = 'block';
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleDeleteBrand(id) {
  if (!confirm('Are you sure you want to delete this brand?')) {
    return;
  }

  try {
    await brandsAPI.delete(id);
    
    toast.success('Brand deleted successfully!');
    
    // Re-render the page using router to maintain route state
    await router.refresh();
  } catch (error) {
    toast.error('Failed to delete brand: ' + error.message);
    console.error('Delete error:', error);
  }
}

function resetBrandForm() {
  editingBrandId = null;
  document.getElementById('brand-form').reset();
  document.getElementById('form-title').textContent = 'Add New Brand';
  document.getElementById('submit-btn').textContent = 'Add Brand';
  document.getElementById('cancel-btn').style.display = 'none';
}

window.handleBrandSubmit = handleBrandSubmit;
window.handleEditBrand = handleEditBrand;
window.handleDeleteBrand = handleDeleteBrand;
window.resetBrandForm = resetBrandForm;

