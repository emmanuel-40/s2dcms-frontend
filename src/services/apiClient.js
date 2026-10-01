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

    // CSRF token captured from X-XSRF-TOKEN response headers (CORS-exposed, so
    // readable cross-origin - document.cookie is NOT)
    this.csrfToken = null;

    // In-flight GET /api/auth/csrf bootstrap, shared by concurrent requests
    this.csrfBootstrap = null;
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

  /*
   * CSRF TOKEN DELIVERY
   *
   * The XSRF-TOKEN cookie is only readable same-origin: document.cookie cannot see
   * another site's cookies, so the deployed SPA never sees it. The backend also puts
   * the token on every response in the CORS-exposed X-XSRF-TOKEN header, and serves
   * it in a JSON body via GET /api/auth/csrf. Both channels feed this client; the
   * cookie read stays as a same-origin (dev proxy) fallback.
   */
  captureCsrfToken(response) {
    const header = response.headers.get('X-XSRF-TOKEN');
    if (header) {
      this.csrfToken = header;
    }
  }

  // Read the non-HttpOnly XSRF-TOKEN cookie set by Spring (same-origin only).
  readCsrfCookie() {
    const match = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('XSRF-TOKEN='));

    if (!match) {
      return null;
    }

    return decodeURIComponent(match.substring('XSRF-TOKEN='.length));
  }

  // Token from a captured response header (cross-origin) or the readable cookie (dev).
  getCsrfToken() {
    return this.csrfToken || this.readCsrfCookie();
  }

  /*
   * Guarantees a token before a state-changing request. Concurrent callers share a
   * single in-flight bootstrap, so a burst of saves triggers one GET /api/auth/csrf.
   */
  primeCsrfToken() {
    return this.ensureCsrfToken({ force: true });
  }

  async ensureCsrfToken({ force = false } = {}) {
    if (force) {
      this.csrfToken = null;
    } else if (this.getCsrfToken()) {
      return this.getCsrfToken();
    }

    if (!this.csrfBootstrap) {
      this.csrfBootstrap = (async () => {
        try {
          const response = await fetch(`${this.baseURL}/auth/csrf`, {
            method: 'GET',
            credentials: 'include',
          });

          if (response.ok) {
            this.captureCsrfToken(response);
            const data = await response.json().catch(() => null);
            if (data && typeof data.token === 'string' && data.token) {
              this.csrfToken = data.token;
            }
          }

          return this.getCsrfToken();
        } catch {
          // Token channels unreachable - the server's 403 path recovers later.
          return this.getCsrfToken();
        } finally {
          this.csrfBootstrap = null;
        }
      })();
    }

    return this.csrfBootstrap;
  }

  async applyCsrfHeader(headers = {}, method) {
    const upper = (method || 'GET').toUpperCase();
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(upper)) {
      return headers;
    }

    const csrfToken = await this.ensureCsrfToken();
    if (!csrfToken) {
      // Nothing to mirror yet: send as-is; a 403 CSRF response triggers re-seed + retry.
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
      skipCsrfRetry = false,
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
    fetchOptions.headers = await this.applyCsrfHeader(
      fetchOptions.headers,
      method
    );

    /*
     * Make original request.
     */
    let response = await fetch(url, fetchOptions);

    /*
     * Cache the fresh CSRF token the backend exposes on every response.
     */
    this.captureCsrfToken(response);

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
         * After refresh, re-seed CSRF via the JSON channel and retry with the
         * fresh cookies.
         */
        try {
          /*
           * Re-seed CSRF through the JSON channel (works cross-origin), then
           * re-read whatever we have.
           */
          const seedResponse = await fetch(`${this.baseURL}/auth/csrf`, {
            method: 'GET',
            credentials: 'include',
          });
          this.captureCsrfToken(seedResponse);
        } catch {
          // Cookie may already exist; continue with whatever we have
        }

        fetchOptions.headers = await this.applyCsrfHeader(
          fetchOptions.headers,
          method
        );

        /*
         * Retry original request with new cookies.
         */
        response = await fetch(url, fetchOptions);
        this.captureCsrfToken(response);

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
      /*
       * Most endpoints answer failures with a JSON envelope, but the AI endpoints answer
       * with text/plain. Reading the body as text first (and only parsing when it looks
       * like JSON) keeps the server's own wording instead of losing it to 'Request failed'.
       */
      const rawBody = await response.text().catch(() => '');
      let error;
      try {
        error = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        error = { message: rawBody };
      }

      /*
       * CSRF rejection on a state-changing call: the token went stale (expired
       * XSRF cookie, reload between seed and save, ...). Re-seed once from the
       * server and retry once - never loop.
       */
      if (
        response.status === 403 &&
        !skipCsrfRetry &&
        ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) &&
        /csrf/i.test(`${error.message || ''} ${error.error || ''}`)
      ) {
        await this.ensureCsrfToken({ force: true });

        return this.request(endpoint, {
          ...options,
          skipCsrfRetry: true,
        });
      }

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
      headers: await this.applyCsrfHeader(options.headers, method),
    });

    /*
     * Keep the CSRF token cache warm on public endpoints too.
     */
    this.captureCsrfToken(response);

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