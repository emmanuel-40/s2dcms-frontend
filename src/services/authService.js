// Authentication Service - Matches Backend Security Pattern
// Implements JWT token rotation, refresh token management, and secure storage

const API_BASE_URL = '/api';

class AuthService {
  constructor() {
    // Access token stored in memory only (never localStorage for security)
    this.accessToken = null;
    // Refresh token stored in localStorage (in production, use httpOnly cookie)
    this.refreshToken = localStorage.getItem('refreshToken') || null;
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  // Store tokens securely
  setTokens(accessToken, refreshToken, user) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    // Derive role from token instead of trusting user object
    this.user = { ...user, role: this.extractRoleFromToken(accessToken) };
    
    // Only refresh token in localStorage (access token in memory only)
    localStorage.setItem('refreshToken', refreshToken);
    // Store user without role - role will be derived from token on load
    const { role, ...userWithoutRole } = user;
    localStorage.setItem('user', JSON.stringify(userWithoutRole));
  }

  // Clear all tokens on logout
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Get current access token
  getAccessToken() {
    return this.accessToken;
  }

  // Get current refresh token
  getRefreshToken() {
    return this.refreshToken;
  }

  // Get current user
  getUser() {
    return this.user;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.accessToken && !!this.user;
  }

  // Get user role
  getUserRole() {
    return this.user?.role || null;
  }

  // Login - matches backend /api/auth/login
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || error.message || 'Login failed');
    }

    const data = await response.json();
    
    // Store tokens and user info
    this.setTokens(data.accessToken, data.refreshToken, {
      email,
      role: this.extractRoleFromToken(data.accessToken)
    });

    return data;
  }

  // Refresh token - matches backend /api/auth/refresh-token
  // Implements token rotation pattern
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Token refresh failed' }));
      // Token rotation failed - clear tokens and redirect to login
      this.clearTokens();
      throw new Error(error.error || error.message || 'Token refresh failed');
    }

    const data = await response.json();
    
    // TOKEN ROTATION: Replace old refresh token with new one
    // Old token is now invalid on backend
    this.setTokens(data.accessToken, data.refreshToken, this.user);

    return data.accessToken;
  }

  // Logout - matches backend /api/auth/logout
  async logout() {
    if (this.refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      } catch (error) {
        // Logout failed silently - clear tokens anyway
      }
    }
    
    this.clearTokens();
  }

  // Register student - matches backend /api/students/auth/register
  async registerStudent(userData) {
    const response = await fetch(`${API_BASE_URL}/students/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(error.error || error.message || 'Registration failed');
    }

    return await response.text();
  }

  // Verify email - matches backend /api/students/auth/verify
  async verifyEmail(token) {
    const response = await fetch(`${API_BASE_URL}/students/auth/verify?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Email verification failed' }));
      throw new Error(error.error || error.message || 'Email verification failed');
    }

    return await response.text();
  }

  // Resend verification - matches backend /api/students/auth/resend-verification
  async resendVerification(email) {
    const response = await fetch(`${API_BASE_URL}/students/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to resend verification' }));
      throw new Error(error.error || error.message || 'Failed to resend verification');
    }

    return await response.text();
  }

  // Forgot password - matches backend /api/auth/forgot-password
  async forgotPassword(email) {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to send reset email' }));
      throw new Error(error.error || error.message || 'Failed to send reset email');
    }

    return await response.text();
  }

  // Reset password - matches backend /api/auth/reset-password
  async resetPassword(token, newPassword) {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: encodeURIComponent(token), newPassword }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Password reset failed' }));
      throw new Error(error.error || error.message || 'Password reset failed');
    }

    return await response.text();
  }

  // Change password - matches backend /api/user/change-password
  async changePassword(oldPassword, newPassword) {
    const response = await fetch(`${API_BASE_URL}/user/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Password change failed' }));
      throw new Error(error.error || error.message || 'Password change failed');
    }

    return await response.text();
  }

  // Extract role from JWT token (for client-side role checking)
  extractRoleFromToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || 'USER';
    } catch (error) {
      return 'USER';
    }
  }

  // Initialize from localStorage on page load
  initialize() {
    this.refreshToken = localStorage.getItem('refreshToken') || null;
    // Read user without role - role will be derived from token
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    this.user = storedUser || null;
    // Access token is NOT persisted - must re-authenticate on page refresh
    // This is a security pattern to prevent token theft
  }
}

export const authService = new AuthService();
