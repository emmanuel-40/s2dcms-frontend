// Department Service - API calls for department endpoints
import { apiClient } from './apiClient';
import { buildComplaintsQuery } from '../utils/complaints';

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
    return await apiClient.get(`/department/complaints?${buildComplaintsQuery(params)}`);
  },

  // Get specific complaint
  getComplaint: async (id) => {
    return await apiClient.get(`/department/complaints/${id}`);
  },

  // Reply to complaint
  replyToComplaint: async (formData) => {
    return await apiClient.postFormData('/department/reply', formData);
  },

  // Close complaint
  closeComplaint: async (complaintId) => {
    return await apiClient.put(`/department/complaints/${complaintId}/close`);
  },

  // Get all departments (public endpoint for registration)
  getAllDepartments: async () => {
    return await apiClient.get('/department/all');
  },
};
