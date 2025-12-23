// Simple Router for Single Page Application
class Router {
  constructor() {
    this.routes = {};
    this.currentPath = window.location.pathname;
    this.init();
  }

  init() {
    // Sync currentPath with actual URL
    this.currentPath = window.location.pathname;
    
    // Handle browser back/forward
    window.addEventListener('popstate', async () => {
      this.currentPath = window.location.pathname;
      await this.handleRoute();
    });

    // Handle initial load
    this.handleRoute().catch(err => console.error('Route handling error:', err));

    // Intercept link clicks
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' || e.target.closest('a')) {
        const link = e.target.closest('a') || e.target;
        const href = link.getAttribute('href');
        
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          e.preventDefault();
          this.navigate(href);
        }
      }
    });
  }

  route(path, handler) {
    this.routes[path] = handler;
  }

  async navigate(path, skipHistory = false) {
    if (!skipHistory) {
      window.history.pushState({}, '', path);
    }
    this.currentPath = path;
    await this.handleRoute();
  }
  
  // Method to refresh current route without changing URL
  async refresh() {
    await this.handleRoute();
  }

  async handleRoute() {
    // Always sync with actual URL to prevent state mismatch
    const actualPath = window.location.pathname;
    if (this.currentPath !== actualPath) {
      this.currentPath = actualPath;
    }
    
    const path = this.currentPath;
    let matched = false;

    // Helper to call handler (async or sync)
    const callHandler = async (handler, params = null) => {
      const result = params !== null ? handler(params) : handler();
      // If result is a Promise, await it
      if (result instanceof Promise) {
        await result;
      }
    };

    // Check exact matches first
    if (this.routes[path]) {
      await callHandler(this.routes[path]);
      matched = true;
    } else {
      // Check dynamic routes
      for (const route in this.routes) {
        const pattern = route.replace(/:[^/]+/g, '([^/]+)');
        const regex = new RegExp(`^${pattern}$`);
        const match = path.match(regex);
        
        if (match) {
          const params = {};
          const paramNames = route.match(/:[^/]+/g) || [];
          paramNames.forEach((name, index) => {
            params[name.slice(1)] = match[index + 1];
          });
          
          await callHandler(this.routes[route], params);
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      // Default to home
      if (this.routes['/']) {
        await callHandler(this.routes['/']);
      }
    }
  }
}

export const router = new Router();

