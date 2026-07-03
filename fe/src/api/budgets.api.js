import apiClient from './client';

export const budgetsApi = {
  getAll: (params = {}) => apiClient.get('/budgets', { params }),
  getById: (id) => apiClient.get(`/budgets/${id}`),
  create: (data) => apiClient.post('/budgets', data),
  update: (id, data) => apiClient.patch(`/budgets/${id}`, data),
  delete: (id) => apiClient.delete(`/budgets/${id}`),
};
