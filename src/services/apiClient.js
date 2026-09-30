// API Client
// Handles:
// - HttpOnly cookie authentication
// - CSRF token handling
// - Automatic access-token refresh
// - Request retry after successful refresh
// - Concurrent refresh protection

import { API_BASE_URL } from '../config';
import { authService } from './authService';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;

    // Prevent multiple refresh requests at the same time
    this.isRefreshing = false;

    // Requests waiting for the refresh to finish
    this.failedQueue = [];
  }

  // Process requests waiting for token refresh
  processQueue(error) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });

    this.failedQueue = [];
  }

  // Add request to refresh queue
  addToQueue(resolve, reject) {
    this.failedQueue.push({
      resolve,
      reject,
    });
  }

  // Get CSRF token from the non-HttpOnly XSRF-TOKEN cookie set by Spring
  getCsrfToken() {
    const match = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('XSRF-TOKEN='));

    if (!match) {
      return null;
    }

    return decodeURIComponent(match.substring('XSRF-TOKEN='.length));

  }

  applyCsrfHeader(headers = {}, method) {
    const upper = (method || 'GET').toUpperCase();
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(upper)) {
      return headers;
    }

    const csrfToken = this.getCsrfToken();
    if (!csrfToken) {
      return headers;
    }

    return {
      ...headers,
      'X-XSRF-TOKEN': csrfToken,
    };
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    /*
     * These are apiClient-only options.
     * They should NOT be passed to fetch().
     */
    const {
      skipAuthRefresh = false,
      responseType = 'json',
      ...fetchOptions
    } = options;

    const method = (
      fetchOptions.method || 'GET'
    ).toUpperCase();

    /*
     * Always send HttpOnly auth cookies + readable XSRF-TOKEN cookie.
     */
    fetchOptions.credentials = 'include';
    fetchOptions.headers = this.applyCsrfHeader(
      fetchOptions.headers,
      method
    );

    /*
     * Make original request.
     */
    let response = await fetch(url, fetchOptions);

    /*
     * ACCESS TOKEN REFRESH
     */
    if (
      response.status === 401 &&
      !skipAuthRefresh
    ) {
      /*
       * Another request is already refreshing.
       * Wait for it to finish.
       */
      if (this.isRefreshing) {
        return new Promise((resolve, reject) => {
          this.addToQueue(resolve, reject);
        }).then(() => {
          return this.request(endpoint, {
            ...options,
            skipAuthRefresh: true,
          });
        });
      }

      this.isRefreshing = true;

      try {
        /*
         * Refresh HttpOnly access + refresh cookies.
         */
        await authService.refreshAccessToken();

        /*
         * After refresh, re-seed CSRF via /auth/me then re-read cookie.
         */
        try {
          await fetch(`${this.baseURL}/auth/me`, {
            method: 'GET',
            credentials: 'include',
          });
        } catch {
          // Cookie may already exist; continue with whatever we have
        }

        fetchOptions.headers = this.applyCsrfHeader(
          fetchOptions.headers,
          method
        );

        /*
         * Retry original request with new cookies.
         */
        response = await fetch(url, fetchOptions);

        /*
         * Allow queued requests to continue.
         */
        this.processQueue(null);

      } catch (refreshError) {
        /*
         * Refresh failed.
         */
        this.processQueue(refreshError);

        authService.clearTokens();

        window.location.href = '/login';

        throw refreshError;

      } finally {
        this.isRefreshing = false;
      }
    }

    /*
     * 204 No Content
     */
    if (response.status === 204) {
      return null;
    }

    /*
     * Handle unsuccessful responses.
     */
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({
          message: 'Request failed',
          error: 'Request failed',
        }));

      if (response.status === 400) {
        throw new Error(
          error.message ||
          error.error ||
          'Bad request'
        );
      }

      if (response.status === 401) {
        throw new Error(
          error.message ||
          error.error ||
          'Unauthorized'
        );
      }

      if (response.status === 403) {
        throw new Error(
          error.message ||
          error.error ||
          'You do not have permission to access this resource.'
        );
      }

      if (response.status === 404) {
        throw new Error(
          error.message ||
          error.error ||
          'Resource not found.'
        );
      }

      if (response.status === 429) {
        throw new Error(
          error.message ||
          error.error ||
          'Too many requests. Please try again later.'
        );
      }

      throw new Error(
        error.message ||
        error.error ||
        'Request failed'
      );
    }

    /*
     * AI endpoints return plain text.
     */
    if (responseType === 'text') {
      return response.text();
    }

    /*
     * Normal API endpoints return JSON.
     */
    return response.json();
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  // POST JSON request
  async post(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data !== null
        ? JSON.stringify(data)
        : undefined,
    });
  }

  // PUT JSON request
  async put(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data !== null
        ? JSON.stringify(data)
        : undefined,
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  // POST FormData request
  //
  // Do NOT manually set Content-Type.
  // Browser creates multipart/form-data boundary automatically.
  async postFormData(endpoint, formData, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    });
  }

  // PUT FormData request
  async putFormData(endpoint, formData, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: formData,
    });
  }

  // Public request (still sends cookies + CSRF when mutating)
  async publicRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();

    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: this.applyCsrfHeader(options.headers, method),
    });

    /*
     * 204 No Content
     */
    if (response.status === 204) {
      return null;
    }

    /*
     * Handle error.
     */
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({
          message: 'Request failed',
          error: 'Request failed',
        }));

      throw new Error(
        error.message ||
        error.error ||
        'Request failed'
      );
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();