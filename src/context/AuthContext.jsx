// Authentication Context - Manages auth state and role-based access
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { getErrorMessage, logError } from '../utils/errors';

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
  const [sessionError, setSessionError] = useState('');

  // Initialize auth state on mount
  useEffect(() => {
    authService.initialize();
    const authUser = authService.getUser();
    
    if (authUser && authService.getRefreshToken()) {
      // User has refresh token but needs to get new access token
      // This happens on page refresh since access token is not persisted
      authService.refreshAccessToken()
        .then(() => {
          setUser(authService.getUser());
          setIsAuthenticated(true);
        })
        .catch((err) => {
          // Refresh failed - clear tokens and keep the reason visible
          logError('Session restore failed', err);
          setSessionError(getErrorMessage(err, 'Your session has expired. Please log in again.'));
          authService.clearTokens();
          setIsAuthenticated(false);
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    const role = authService.getUserRole();

    if (!role) {
      // The access token could not be decoded - do not leave the app in a
      // half-authenticated state with an unknown role
      authService.clearTokens();
      throw new Error('Could not determine your account role. Please try logging in again.');
    }

    setSessionError('');
    setUser(authService.getUser());
    setIsAuthenticated(true);
    return { ...data, role };
  };

  // Always clears local state; returns the (already logged) error if the
  // backend session could not be revoked so callers can inform the user.
  const logout = async () => {
    const { revokeError } = await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    return { revokeError };
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
    sessionError,
    clearSessionError: () => setSessionError(''),
    login,
    logout,
    registerStudent,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    getUserRole: () => user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
