// API Service Layer - Backend Communication
const API_BASE_URL = '/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  // Determine if we're sending FormData (for file uploads)
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...options.headers,
  };
  
  // Only set Content-Type for JSON, not for FormData (browser will set it with boundary)
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    // Convert JSON body to string if not FormData
    let body = options.body;
    if (!isFormData && body && typeof body !== 'string') {
      body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      body,
      headers,
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, get text response
      const text = await response.text();
      console.error('Non-JSON response:', text);
      
      // Try to extract error message from HTML or text
      if (text.includes('Proxy error') || text.includes('ECONNREFUSED')) {
        throw new Error('Cannot connect to server. Please make sure the backend server is running on port 3000.');
      }
      
      throw new Error(`Server error: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error.message && (error.message.includes('connect to server') || error.message.includes('Server error'))) {
      throw error;
    }
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Cannot reach server. Please check if the backend is running on http://localhost:3000');
    }
    
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      throw new Error('Invalid response from server. Please check if the backend is running correctly.');
    }
    
    console.error('API Error:', error);
    throw error;
  }
}

// ==================== AUTH API ====================
export const authAPI = {
  async register(userData) {
    return apiCall('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async login(email, password) {
    return apiCall('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getCurrentUser() {
    // Get user from token - would need a /users/me endpoint
    // For now, return null or implement if backend has it
    return null;
  },
};

// ==================== PRODUCTS API ====================
export const productsAPI = {
  async getAll() {
    return apiCall('/products');
  },

  async getById(id) {
    return apiCall(`/products/${id}`);
  },

  async create(productData, imageFile = null) {
    // If image file provided, use FormData
    if (imageFile) {
      const formData = new FormData();
      Object.keys(productData).forEach(key => {
        if (key !== 'images') {
          formData.append(key, productData[key]);
        }
      });
      // If images array exists, append it
      if (productData.images && Array.isArray(productData.images)) {
        formData.append('images', JSON.stringify(productData.images));
      }
      formData.append('image', imageFile);
      
      return apiCall('/products', {
        method: 'POST',
        body: formData,
        headers: {}, // Don't set Content-Type, let browser set it with boundary
      });
    } else {
      // No image, use JSON
      return apiCall('/products', {
        method: 'POST',
        body: productData,
      });
    }
  },

  async update(id, productData, imageFile = null) {
    // If image file provided, use FormData
    if (imageFile) {
      const formData = new FormData();
      Object.keys(productData).forEach(key => {
        if (key !== 'images') {
          formData.append(key, productData[key]);
        }
      });
      // If images array exists, append it
      if (productData.images && Array.isArray(productData.images)) {
        formData.append('images', JSON.stringify(productData.images));
      }
      formData.append('image', imageFile);
      
      return apiCall(`/products/${id}`, {
        method: 'PUT',
        body: formData,
        headers: {}, // Don't set Content-Type, let browser set it with boundary
      });
    } else {
      // No image, use JSON
      return apiCall(`/products/${id}`, {
        method: 'PUT',
        body: productData,
      });
    }
  },

  async delete(id) {
    return apiCall(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== ORDERS API ====================
export const ordersAPI = {
  async create(orderData) {
    // Ensure items is a proper array - make a deep copy to avoid any reference issues
    const itemsArray = Array.isArray(orderData.items) 
      ? orderData.items.map(item => ({
          product: item.product || item.id,
          quantity: parseInt(item.quantity) || 1,
          price: parseFloat(item.price) || 0,
        }))
      : [];
    
    const dataToSend = {
      userId: orderData.userId,
      items: itemsArray, // Ensure it's a fresh array
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      totalPrice: parseFloat(orderData.totalPrice) || 0,
    };
    
    console.log('Sending order data:', JSON.stringify(dataToSend, null, 2));
    console.log('Items is array:', Array.isArray(dataToSend.items));
    
    // Pass as object, apiCall will stringify it properly
    return apiCall('/orders', {
      method: 'POST',
      body: dataToSend,
    });
  },

  async checkout(orderId, paymentMethod) {
    return apiCall('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentMethod }),
    });
  },

  async getAll(userId = null) {
    const endpoint = userId ? `/orders?userId=${userId}` : '/orders';
    return apiCall(endpoint);
  },

  async getById(id) {
    return apiCall(`/orders/${id}`);
  },

  async updateStatus(id, status) {
    return apiCall(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// ==================== USERS API ====================
export const usersAPI = {
  async getProfile() {
    return apiCall('/users/me');
  },

  async updateProfile(userId, userData) {
    return apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
};

// ==================== BRANDS API ====================
export const brandsAPI = {
  async getAll() {
    return apiCall('/brands');
  },

  async getById(id) {
    return apiCall(`/brands/${id}`);
  },

  async getBySlug(slug) {
    return apiCall(`/brands/slug/${slug}`);
  },

  async create(brandData) {
    return apiCall('/brands', {
      method: 'POST',
      body: JSON.stringify(brandData),
    });
  },

  async update(id, brandData) {
    return apiCall(`/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(brandData),
    });
  },

  async delete(id) {
    return apiCall(`/brands/${id}`, {
      method: 'DELETE',
    });
  },
};

