// Public Auth Service - endpoints reachable without an access token
import axios from 'axios';
import { BACKEND_API_URL } from '../utils/constants';

export const publicAuthService = {
  resendVerification: async (email) => {
    await axios.post(`${BACKEND_API_URL}/students/auth/resend-verification`, { email });
  },

  verifyEmail: async (token) => {
    await axios.get(`${BACKEND_API_URL}/students/auth/verify?token=${token}`);
  },

  forgotPassword: async (email) => {
    await axios.post(`${BACKEND_API_URL}/auth/forgot-password`, { email });
  },

  resetPassword: async (token, newPassword) => {
    await axios.post(`${BACKEND_API_URL}/auth/reset-password`, { token, newPassword });
  },
};
