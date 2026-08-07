import { apiClient } from './apiClient';

const adminService = {
  // Department Management
  createDepartment: async (departmentData) => {
    return await apiClient.post('/department/admin/create', departmentData);
  },

  deleteDepartment: async (id) => {
    await apiClient.delete(`/department/admin/${id}`);
  },

  updateDepartmentPassword: async (id, newPassword) => {
    await apiClient.put(`/department/admin/${id}/password`, { newPassword });
  },

  // Student Management
  getAllStudents: async () => {
    return await apiClient.get('/students/admin/all');
  },

  deleteStudent: async (id) => {
    await apiClient.delete(`/students/admin/${id}`);
  },

  // Get all departments
  getAllDepartments: async () => {
    return await apiClient.get('/department/all');
  },
};

export default adminService;
