// Authentication Context - Manages auth state and role-based access
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

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
        .catch(() => {
          // Refresh failed - clear tokens
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
    setUser(authService.getUser());
    setIsAuthenticated(true);
    return { ...data, role: authService.getUserRole() };
  };

  const logout = async () => {
    await authService.logout();
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
    getUserRole: () => user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
