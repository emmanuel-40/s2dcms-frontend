// API Client with Automatic Token Refresh
// Implements token rotation and handles 401 errors gracefully

import { authService } from './authService';
import { ApiError, NetworkError, parseErrorBody } from '../utils/errors';

const API_BASE_URL = '/api';

const DEFAULT_STATUS_MESSAGES = {
  400: 'The request was invalid. Please check your input and try again.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to access this resource.',
  404: 'Resource not found.',
  413: 'The uploaded file is too large.',
  429: 'Too many requests. Please try again later.',
  500: 'The server encountered an error. Please try again later.',
  503: 'The service is temporarily unavailable. Please try again later.',
};

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

  // Perform the network call, mapping transport failures to NetworkError so
  // callers can tell "server unreachable" apart from "server said no".
  async fetchOrThrow(url, options) {
    try {
      return await fetch(url, options);
    } catch (networkError) {
      throw new NetworkError(undefined, { cause: networkError });
    }
  }

  // Make API request with automatic token refresh
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const accessToken = authService.getAccessToken();

    // Add authorization header if access token exists
    if (accessToken && !options.skipAuthCheck) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      };
    }

    let response = await this.fetchOrThrow(url, options);

    // Handle 401 Unauthorized - attempt token refresh
    if (response.status === 401 && !options.skipAuthRefresh && !options.skipAuthCheck) {
      if (this.isRefreshing) {
        // Already refreshing - wait for it, then retry once with the new token.
        // A rejection here (refresh failed) propagates to the caller.
        await new Promise((resolve, reject) => {
          this.addToQueue(resolve, reject);
        });
        return this.request(endpoint, { ...options, skipAuthRefresh: true });
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
        response = await this.fetchOrThrow(url, options);
      } catch (refreshError) {
        this.processQueue(refreshError, null);

        // A transport failure says nothing about the validity of the session,
        // so keep the tokens and let the caller report the network problem
        if (!(refreshError instanceof NetworkError)) {
          authService.clearTokens();

          // Redirect to login, unless we are already there (avoids a reload
          // loop that would wipe the error shown on the login page)
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }

        throw refreshError;
      } finally {
        this.isRefreshing = false;
      }
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return null;
    }

    // Handle other error responses
    if (!response.ok) {
      const { message, body } = await parseErrorBody(response);
      throw new ApiError(
        message || DEFAULT_STATUS_MESSAGES[response.status] || `Request failed (${response.status})`,
        { status: response.status, body }
      );
    }

    return this.parseBody(response);
  }

  // Parse a successful response. Several backend endpoints answer with plain
  // text or an empty body, so only parse JSON when the body really is JSON.
  async parseBody(response) {
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (!text) {
      return null;
    }

    if (!contentType.includes('json')) {
      return text;
    }

    try {
      return JSON.parse(text);
    } catch (parseError) {
      throw new ApiError('Received a malformed response from the server.', {
        status: response.status,
        body: text,
        cause: parseError,
      });
    }
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
