// Authentication Context - Manages auth state and role-based access
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { queryClient } from '../lib/queryClient';
import { API_BASE_URL } from '../config';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
  const initializeAuth = async () => {
    authService.initialize();

    try {
      let response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });

      // Access token may be missing or expired (401), or anonymous denial (legacy 403).
      if (response.status === 401 || response.status === 403) {
        try {
          await authService.refreshAccessToken();

          // Try /auth/me again after successful refresh
          response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include',
          });
        } catch {
          throw new Error('Not authenticated');
        }
      }

      if (!response.ok) {
        throw new Error('Not authenticated');
      }

      const data = await response.json();

      if (
        data &&
        data.email &&
        data.email !== 'anonymousUser' &&
        data.role !== 'ANONYMOUS'
      ) {
        setUser(data);
        setIsAuthenticated(true);
        authService.setUser(data);
      } else {
        throw new Error('Invalid authentication data');
      }

    } catch {
      authService.clearTokens();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  initializeAuth();
}, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);

    // Seed XSRF-TOKEN cookie (login is CSRF-ignored; this GET is not)
    try {
      const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
      if (meResponse.ok) {
        const me = await meResponse.json();
        if (me?.email && me.email !== 'anonymousUser') {
          authService.setUser(me);
          setUser(me);
          setIsAuthenticated(true);
          return { ...data, role: me.role || data.role };
        }
      }
    } catch {
      // Fall through to login response data if /auth/me fails
    }

    setUser(authService.getUser());
    setIsAuthenticated(true);
    return { ...data, role: data.role || authService.getUserRole() };
  };

  const logout = async () => {
    await authService.logout();

    // Drop every cached query. Complaints, profiles and attachments are private to this session;
    // without this, signing in as someone else on the same tab would briefly render the previous
    // user's data straight out of the cache, with no request to reveal it was stale.
    queryClient.clear();

    setUser(null);
    setIsAuthenticated(false);
  };

  const registerStudent = async (userData) => {
    return await authService.registerStudent(userData);
  };

  const verifyEmail = async (token) => {
    return await authService.verifyEmail(token);
  };

  const resendVerification = async (email) => {
    return await authService.resendVerification(email);
  };

  const forgotPassword = async (email) => {
    return await authService.forgotPassword(email);
  };

  const resetPassword = async (token, newPassword) => {
    return await authService.resetPassword(token, newPassword);
  };

  const changePassword = async (oldPassword, newPassword) => {
    return await authService.changePassword(oldPassword, newPassword);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    registerStudent,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    getUser: () => user,
    getUserRole: () => user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
