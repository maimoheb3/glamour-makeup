import { state } from '../state.js';
import { router } from '../router.js';
import { authAPI } from '../api.js';
import { renderNavbar } from '../navbar.js';

export function renderLogin() {
  const content = document.getElementById('app-content');
  
  content.innerHTML = `
    <div class="login-card">
      <button class="close-btn" onclick="router.navigate('/')">×</button>
      <h2>Welcome Back</h2>
      <p class="subtitle">Sign in to your Glamour account</p>
      <form id="login-form" onsubmit="handleLogin(event)">
        <input type="email" name="email" placeholder="Username or Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit" class="login-btn">Sign In</button>
      </form>
      <p class="signup-text">
        Don't have an account? <a href="/signup" onclick="event.preventDefault(); router.navigate('/signup')">Sign up</a>
      </p>
      <p class="subtitle" style="margin-top: 15px; font-size: 14px;">
        Admin → admin@glamour.com / admin123
      </p>
    </div>
  `;
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    const response = await authAPI.login(email, password);
    
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

    // Redirect
    router.navigate('/');
  } catch (error) {
    const { toast } = await import('../toast.js');
    toast.error('Login failed: ' + error.message);
    console.error('Login error:', error);
  }
}

window.handleLogin = handleLogin;

