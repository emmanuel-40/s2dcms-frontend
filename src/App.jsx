// Main App Component with Routing
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ToastViewport from './components/ToastViewport';
import { ProtectedRoute, StudentRoute, DepartmentRoute, AdminRoute } from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerificationPage from './pages/VerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import StudentComplaints from './pages/StudentComplaints';
import NewComplaint from './pages/NewComplaint';
import ComplaintDetail from './pages/ComplaintDetail';
import DepartmentDashboard from './pages/DepartmentDashboard';
import DepartmentProfile from './pages/DepartmentProfile';
import DepartmentComplaints from './pages/DepartmentComplaints';
import ReplyComplaint from './pages/ReplyComplaint';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          {/*
            ToastViewport sits OUTSIDE <Routes>, as a sibling of the router rather than a child of
            any page. Sending a reply navigates away the instant the request resolves; if the toast
            lived inside ReplyComplaint it would be unmounted in the same tick it appeared and the
            confirmation would vanish before it could be read. Here it outlives the route.

            */}
          <ToastViewport />

          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Student Routes */}
          <Route 
            path="/student/dashboard" 
            element={
              <StudentRoute>
                <StudentDashboard />
              </StudentRoute>
            } 
          />
          <Route 
            path="/student/profile" 
            element={
              <StudentRoute>
                <StudentProfile />
              </StudentRoute>
            } 
          />
          <Route 
            path="/student/complaints" 
            element={
              <StudentRoute>
                <StudentComplaints />
              </StudentRoute>
            } 
          />
          <Route 
            path="/student/complaints/new" 
            element={
              <StudentRoute>
                <NewComplaint />
              </StudentRoute>
            } 
          />
          <Route 
            path="/student/complaints/:id" 
            element={
              <StudentRoute>
                <ComplaintDetail userType="student" />
              </StudentRoute>
            } 
          />
          
          {/* Department Routes */}
          <Route 
            path="/department/dashboard" 
            element={
              <DepartmentRoute>
                <DepartmentDashboard />
              </DepartmentRoute>
            } 
          />
          <Route 
            path="/department/profile" 
            element={
              <DepartmentRoute>
                <DepartmentProfile />
              </DepartmentRoute>
            } 
          />
          <Route 
            path="/department/complaints" 
            element={
              <DepartmentRoute>
                <DepartmentComplaints />
              </DepartmentRoute>
            } 
          />
          <Route 
            path="/department/complaints/:id" 
            element={
              <DepartmentRoute>
                <ComplaintDetail userType="department" />
              </DepartmentRoute>
            } 
          />
          <Route 
            path="/department/complaints/:id/reply" 
            element={
              <DepartmentRoute>
                <ReplyComplaint />
              </DepartmentRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
