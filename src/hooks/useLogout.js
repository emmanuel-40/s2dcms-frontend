import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Logs the user out and returns them to the login page
export const useLogout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);
};
