// Reset Password Page
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // A reset link is single-use: the token is nulled the moment the password changes.
  const [linkStatus, setLinkStatus] = useState('checking'); // checking | valid | expired | invalid

  useEffect(() => {
    let active = true;

    if (!token) {
      setLinkStatus('invalid');
      return;
    }

    authService
      .validateResetToken(token)
      .then((status) => {
        if (active) setLinkStatus(status);
      })
      .catch(() => {
        // A failed probe is treated as unusable: showing the form would only lead to a
        // guaranteed rejection on submit.
        if (active) setLinkStatus('invalid');
      });

    return () => {
      active = false;
    };
  }, [token]);

  const linkMessage = {
    expired: 'This reset link has expired. Reset links are valid for 24 hours.',
    invalid: 'This reset link has already been used, or the link is invalid.',
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, formData.newPassword);
      setMessage('Password reset successful. Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (linkStatus === 'checking') {
    return <LoadingSpinner text="Checking your reset link..." size="lg" />;
  }

  if (linkStatus !== 'valid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Link no longer valid</h1>
          <p className="text-gray-600 text-sm mb-6">{linkMessage[linkStatus]}</p>

          <Link
            to="/forgot-password"
            className="inline-block w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Request a new reset link
          </Link>

          <div className="mt-4 text-sm">
            <Link to="/login" className="text-blue-600 hover:text-blue-800">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h1>
        <p className="text-gray-600 text-sm mb-6">Enter your new password below</p>
        
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          <button 
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
