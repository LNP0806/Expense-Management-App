import apiClient from './client';

export const budgetsApi = {
  getAll: (params = {}) => apiClient.get('/budgets', { params }),
  getById: (id: string) => apiClient.get(`/budgets/${id}`),
  create: (data: any) => apiClient.post('/budgets', data),
  update: (id: string, data: any) => apiClient.patch(`/budgets/${id}`, data),
  delete: (id: string) => apiClient.delete(`/budgets/${id}`),
  getSpent: () => apiClient.get('/budgets/spent'),
};
