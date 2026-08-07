// Protected Route Component - Role-based access control
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, getUserRole, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && getUserRole() !== requiredRole) {
    // User is authenticated but doesn't have the required role
    const userRole = getUserRole();
    if (userRole === 'STUDENT') {
      return <Navigate to="/student/dashboard" replace />;
    } else if (userRole === 'DEPARTMENT') {
      return <Navigate to="/department/dashboard" replace />;
    } else if (userRole === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const StudentRoute = ({ children }) => {
  return <ProtectedRoute requiredRole="STUDENT">{children}</ProtectedRoute>;
};

export const DepartmentRoute = ({ children }) => {
  return <ProtectedRoute requiredRole="DEPARTMENT">{children}</ProtectedRoute>;
};

export const AdminRoute = ({ children }) => {
  return <ProtectedRoute requiredRole="ADMIN">{children}</ProtectedRoute>;
};
