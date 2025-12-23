import { state } from '../state.js';
import { router } from '../router.js';
import { usersAPI } from '../api.js';
import { renderNavbar } from '../navbar.js';

export function renderProfile() {
  const content = document.getElementById('app-content');
  const user = state.getUser();
  
  if (!user) {
    router.navigate('/login');
    return;
  }
  
  content.innerHTML = `
    <div class="page-container">
      <div class="profile-card">
        <h2>My Profile</h2>
        <p class="subtitle">Account information</p>

        <div class="profile-info">
          <div>
            <span>Name</span>
            <p>${user.name || ''}</p>
          </div>
          <div>
            <span>Email</span>
            <p>${user.email || ''}</p>
          </div>
          <div>
            <span>Role</span>
            <p class="role-badge">${user.role || (user.isAdmin ? 'admin' : 'user')}</p>
          </div>
        </div>

        <form id="profile-form" onsubmit="handleUpdateProfile(event)">
          <h3>Update Profile</h3>
          <input type="text" name="name" value="${user?.name || ''}" placeholder="Full Name" required />
          <input type="email" name="email" value="${user?.email || ''}" placeholder="Email" required />
          <input type="text" name="address" value="${user?.address || ''}" placeholder="Address" />
          <button type="submit" class="login-btn">Update Profile</button>
        </form>

        <div class="profile-actions">
          <button class="orders-btn" onclick="router.navigate('/orders')" style="margin-top: 20px; width: 100%;">My Orders</button>
          <button class="logout-btn" onclick="handleProfileLogout()" style="margin-top: 10px; width: 100%;">Logout</button>
        </div>
      </div>
    </div>
  `;
}

function handleProfileLogout() {
  state.logout();
  renderNavbar();
  router.navigate('/login');
}

window.handleProfileLogout = handleProfileLogout;

async function handleUpdateProfile(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const user = state.getUser();

  const userData = {
    name: formData.get('name'),
    email: formData.get('email'),
    address: formData.get('address'),
  };

  try {
    await usersAPI.updateProfile(user.id || user._id, userData);
    
    // Update user in state
    state.setUser({
      ...user,
      ...userData,
    });

    const { toast } = await import('../toast.js');
    toast.success('Profile updated successfully!');
    
    // Re-render the page to show updated profile
    await router.refresh();
  } catch (error) {
    const { toast } = await import('../toast.js');
    toast.error('Failed to update profile: ' + error.message);
    console.error('Profile update error:', error);
  }
}

window.handleUpdateProfile = handleUpdateProfile;

