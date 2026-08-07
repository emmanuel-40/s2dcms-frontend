// Student Service - API calls for student endpoints
import { apiClient } from './apiClient';

export const studentService = {
  // Get student profile
  getProfile: async () => {
    return await apiClient.get('/students/profile');
  },

  // Update student profile
  updateProfile: async (formData) => {
    return await apiClient.putFormData('/students/profile', formData);
  },

  // Send complaint
  sendComplaint: async (formData) => {
    return await apiClient.postFormData('/students/complaints', formData);
  },

  // Get student complaints
  getComplaints: async (params = {}) => {
    const { status = 'ALL', sort = 'NEWEST', page = 0, size = 10 } = params;
    const queryParams = new URLSearchParams({
      status,
      sort,
      page: page.toString(),
      size: size.toString(),
    });
    return await apiClient.get(`/students/complaints?${queryParams}`);
  },

  // Get specific complaint
  getComplaint: async (id) => {
    return await apiClient.get(`/students/complaints/${id}`);
  },

  // Register student
  register: async (userData) => {
    return await apiClient.post('/students/auth/register', userData);
  },

  // Verify email
  verifyEmail: async (token) => {
    return await apiClient.get(`/students/auth/verify?token=${token}`);
  },

  // Resend verification
  resendVerification: async (email) => {
    return await apiClient.post('/students/auth/resend-verification', { email });
  },
};
