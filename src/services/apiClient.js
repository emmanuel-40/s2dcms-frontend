// API Client with Automatic Token Refresh
// Implements token rotation and handles 401 errors gracefully

import { authService } from './authService';

const API_BASE_URL = '/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // Process queued requests after token refresh
  processQueue(error, token = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  // Add request to refresh queue
  addToQueue(resolve, reject) {
    this.failedQueue.push({ resolve, reject });
  }

  // Make API request with automatic token refresh
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Add authorization header if access token exists
    if (authService.getAccessToken()) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${authService.getAccessToken()}`,
      };
    }

    let response = await fetch(url, options);

    // Handle 401 Unauthorized - attempt token refresh
    if (response.status === 401 && !options.skipAuthRefresh) {
      if (this.isRefreshing) {
        // Already refreshing - add to queue
        return new Promise((resolve, reject) => {
          this.addToQueue(resolve, reject);
        }).then(() => this.request(endpoint, { ...options, skipAuthRefresh: true }))
          .catch(err => Promise.reject(err));
      }

      this.isRefreshing = true;

      try {
        // Attempt to refresh token
        const newAccessToken = await authService.refreshAccessToken();
        
        // Update authorization header with new token
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${newAccessToken}`,
        };

        // Process queued requests
        this.processQueue(null, newAccessToken);

        // Retry original request
        response = await fetch(url, options);
      } catch (refreshError) {
        // Token refresh failed - clear tokens and process queue with error
        this.processQueue(refreshError, null);
        authService.clearTokens();
        
        // Redirect to login (handled by auth context)
        window.location.href = '/login';
        
        throw refreshError;
      } finally {
        this.isRefreshing = false;
      }
    }

    // Handle other error responses
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      
      // Handle rate limiting (429)
      if (response.status === 429) {
        throw new Error(error.message || 'Too many requests. Please try again later.');
      }
      
      // Handle forbidden (403)
      if (response.status === 403) {
        throw new Error(error.message || 'You do not have permission to access this resource.');
      }
      
      // Handle not found (404)
      if (response.status === 404) {
        throw new Error(error.message || 'Resource not found.');
      }
      
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // GET request
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
  }

  // PUT request
  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // POST with FormData (for file uploads)
  postFormData(endpoint, formData, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData - browser sets it automatically with boundary
        ...options.headers,
      },
      body: formData,
    });
  }

  // PUT with FormData (for file uploads)
  putFormData(endpoint, formData, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        // Don't set Content-Type for FormData
        ...options.headers,
      },
      body: formData,
    });
  }

  // Public request (no authentication required)
  publicRequest(endpoint, options = {}) {
    return this.request(endpoint, { ...options, skipAuthCheck: true });
  }
}

export const apiClient = new ApiClient();
