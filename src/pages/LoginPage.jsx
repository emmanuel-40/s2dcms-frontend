// Login Page
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isEmailNotVerified, setIsEmailNotVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attemptsWarning, setAttemptsWarning] = useState('');
  const { login, getUserRole } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsEmailNotVerified(false);
    setResendMessage('');
    setAttemptsWarning('');
    setLoading(true);

    try {
      const data = await login(formData.email, formData.password);
      const role = data.role;

      // Redirect based on role
      if (role === 'STUDENT') {
        navigate('/student/dashboard');
      } else if (role === 'DEPARTMENT') {
        navigate('/department/dashboard');
      } else if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/login');
      }
    } catch (err) {
      if (err.message === 'Email not verified') {
        setIsEmailNotVerified(true);
        setError('Your email is not verified. Please verify your email to login.');
      } else if (err.message.includes('Too many attempts')) {
        setAttemptsWarning(err.message);
        setError('Rate limit exceeded. Please wait before trying again.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage('');

    try {
      await axios.post('http://localhost:8080/api/students/auth/resend-verification', {
        email: formData.email
      });
      setResendMessage('Verification email sent successfully. Please check your inbox.');
    } catch (err) {
      setResendMessage(err.response?.data || 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
            ← Back to Home
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">S2DCMS Login</h1>
        <p className="text-gray-600 text-sm mb-6">Student to Department Complaint Management System</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded mb-4">
            {error}
            {isEmailNotVerified && (
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="mt-2 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
            )}
          </div>
        )}

        {attemptsWarning && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded mb-4">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="font-medium">{attemptsWarning}</span>
            </div>
          </div>
        )}

        {resendMessage && (
          <div className={`p-3 rounded mb-4 ${resendMessage.includes('success') ? 'bg-green-50 border border-green-200 text-green-600' : 'bg-yellow-50 border border-yellow-200 text-yellow-600'}`}>
            {resendMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type="text"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="off"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10"
                style={{
                  WebkitTextSecurity: showPassword ? 'none' : 'disc'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.06 10.06 0 0 1-4.132 5.411"/>
                    <path d="M3 3l3.59 3.59m0 0A9.953 9.953 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 0 1-4.132 5.411m0 0L21 21"/>
                    <path d="M14.12 14.12a3 3 0 1 0-4.24-4.24"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          <Link to="/register" className="text-blue-600 hover:text-blue-800 mx-2">Register as Student</Link>
          <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800 mx-2">Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
