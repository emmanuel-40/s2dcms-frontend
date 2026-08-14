// Department Service - API calls for department endpoints
import { apiClient } from './apiClient';

export const departmentService = {
  // Get department profile
  getProfile: async () => {
    return await apiClient.get('/department/profile');
  },

  // Update department profile
  updateProfile: async (formData) => {
    return await apiClient.putFormData('/department/profile', formData);
  },

  // Get department complaints
  getComplaints: async (params = {}) => {
    const { status = 'ALL', sort = 'NEWEST', page = 0, size = 10 } = params;
    const queryParams = new URLSearchParams({
      status,
      sort,
      page: page.toString(),
      size: size.toString(),
    });
    return await apiClient.get(`/department/complaints?${queryParams}`);
  },

  // Get specific complaint
  getComplaint: async (id) => {
    return await apiClient.get(`/department/complaints/${encodeURIComponent(id)}`);
  },

  // Reply to complaint
  replyToComplaint: async (formData) => {
    return await apiClient.postFormData('/department/reply', formData);
  },

  // Close complaint
  closeComplaint: async (complaintId) => {
    return await apiClient.put(`/department/complaints/${encodeURIComponent(complaintId)}/close`);
  },

  // Get all departments (public endpoint for registration)
  getAllDepartments: async () => {
    return await apiClient.get('/department/all');
  },
};
