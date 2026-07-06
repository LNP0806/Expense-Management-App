import apiClient from './client';

export const categoriesApi = {
  getAll: (params = {}) => apiClient.get('/categories', { params }),
  create: (data: any) => apiClient.post('/categories', data),
  update: (id: string, data: any) => apiClient.patch(`/categories/${id}`, data),
  delete: (id: string) => apiClient.delete(`/categories/${id}`),
};
