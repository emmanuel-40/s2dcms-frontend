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

  // Paged lists (admin)
  getDepartmentsPage: async (params = {}) => {
    const { page = 0, size = 10 } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    return await apiClient.get(`/department/admin/page?${queryParams}`);
  },

  getStudentsPage: async (params = {}) => {
    const { page = 0, size = 10 } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    return await apiClient.get(`/students/admin/page?${queryParams}`);
  },

  // Get all departments (public list, used by registration/admin view fallback)
  getAllDepartments: async () => {
    return await apiClient.get('/department/all');
  },
};

export default adminService;
