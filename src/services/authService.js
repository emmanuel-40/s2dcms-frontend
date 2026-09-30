// Authentication Service - Cookie based JWT authentication
// JWT access and refresh tokens are stored in HttpOnly cookies.
// JavaScript never reads or stores the actual tokens.

import { API_BASE_URL } from '../config';
import { apiClient } from './apiClient';

// Module-level lock to prevent concurrent refresh attempts
let refreshing = false;
let refreshPromise = null;

class AuthService {
  constructor() {
    // Only user information is kept in JavaScript.
    // JWT tokens are handled entirely by HttpOnly cookies.
    this.user = null;
  }

  // Store user information
  setUser(user) {
    this.user = { ...user };
  }

  // Clear frontend authentication state.
  // The backend is responsible for clearing the authentication cookies.
  clearTokens() {
    this.user = null;
  }

  // Get current user
  getUser() {
    return this.user;
  }

  // Check if user is authenticated
  // Actual authentication is established by the backend.
  isAuthenticated() {
    return !!this.user;
  }

  // Get current user role
  getUserRole() {
    return this.user?.role || null;
  }

  // Login
  // Backend sets accessToken and refreshToken as HttpOnly cookies.
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Login failed',
      }));

      throw new Error(
        error.error || error.message || 'Login failed'
      );
    }

    const data = await response.json();

    // Only store non-sensitive user information.
    // JWT tokens remain inside HttpOnly cookies.
    this.setUser({
      email: data.email,
      role: data.role,
    });

    return data;
  }

  // Refresh authentication
  // Backend reads the HttpOnly refreshToken cookie,
  // rotates the refresh token, and sets new HttpOnly cookies.
  async refreshAccessToken() {
  if (refreshing) {
    return refreshPromise;
  }

  refreshing = true;

  refreshPromise = (async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/refresh-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: 'Token refresh failed',
        }));

        this.clearTokens();

        throw new Error(
          error.error ||
          error.message ||
          'Token refresh failed'
        );
      }

      const data = await response.json();

      return data;

    } finally {
      refreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

  // Logout
  // Backend revokes the refresh token and clears both cookies.
  async logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });
    } catch (error) {
      // Even if the request fails, clear frontend state.
    }

    this.clearTokens();
  }

  // Register student
  async registerStudent(userData) {
    const response = await fetch(`${API_BASE_URL}/students/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Registration failed',
      }));

      throw new Error(
        error.error || error.message || 'Registration failed'
      );
    }

    return await response.text();
  }

  // Verify email
  async verifyEmail(token) {
    const response = await fetch(
      `${API_BASE_URL}/students/auth/verify?token=${encodeURIComponent(token)}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Email verification failed',
      }));

      throw new Error(
        error.error ||
        error.message ||
        'Email verification failed'
      );
    }

    return await response.text();
  }

  // Resend verification email
  async resendVerification(email) {
    const response = await fetch(
      `${API_BASE_URL}/students/auth/resend-verification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Failed to resend verification',
      }));

      throw new Error(
        error.error ||
        error.message ||
        'Failed to resend verification'
      );
    }

    return await response.text();
  }

  // Forgot password
  async forgotPassword(email) {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Failed to send reset email',
      }));

      throw new Error(
        error.error ||
        error.message ||
        'Failed to send reset email'
      );
    }

    return await response.text();
  }

  // Reset password
  async resetPassword(token, newPassword) {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: encodeURIComponent(token),
        newPassword,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Password reset failed',
      }));

      throw new Error(
        error.error ||
        error.message ||
        'Password reset failed'
      );
    }

    return await response.text();
  }

  // Change password
  async changePassword(oldPassword, newPassword) {
    return await apiClient.post('/user/change-password', {
      oldPassword,
      newPassword,
    });
  }

  // Initialize authentication state.
  // Cookies are handled automatically by the browser.
  // AuthContext will verify authentication with /auth/me.
  initialize() {
    this.clearTokens();
  }
}

export const authService = new AuthService();