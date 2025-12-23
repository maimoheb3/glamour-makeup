import { state } from '../state.js';
import { router } from '../router.js';
import { authAPI } from '../api.js';
import { renderNavbar } from '../navbar.js';

export function renderSignup() {
  const content = document.getElementById('app-content');
  
  content.innerHTML = `
    <div class="login-card">
      <h2>Create Account</h2>
      <p class="subtitle">Sign up to continue</p>
      <form id="signup-form" onsubmit="handleSignup(event)">
        <input type="text" name="name" placeholder="Full name" required />
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit" class="login-btn">Sign Up</button>
      </form>
      <p class="signup-text">
        Already have an account? <a href="/login" onclick="event.preventDefault(); router.navigate('/login')">Sign in</a>
      </p>
    </div>
  `;
}

async function handleSignup(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const userData = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  };

  try {
    const response = await authAPI.register(userData);
    
    // Set user in state - MongoDB uses _id, but we'll store as id for consistency
    // This will automatically clear cart if switching users
    state.setUser({
      id: response.user.id || response.user._id,
      _id: response.user._id || response.user.id,
      name: response.user.name,
      email: response.user.email,
      isAdmin: response.user.isAdmin,
      role: response.user.isAdmin ? 'admin' : 'user',
      token: response.token,
    });

    // Update navbar
    renderNavbar();

    // Redirect to home
    const { toast } = await import('../toast.js');
    toast.success('Account created successfully!');
    router.navigate('/');
  } catch (error) {
    const { toast } = await import('../toast.js');
    toast.error('Signup failed: ' + error.message);
    console.error('Signup error:', error);
  }
}

window.handleSignup = handleSignup;

