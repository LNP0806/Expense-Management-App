import apiClient from './client';

export const transactionsApi = {
  getAll: (params = {}) => apiClient.get('/transactions', { params }),
  getById: (id) => apiClient.get(`/transactions/${id}`),
  create: (formData) => apiClient.post('/transactions', formData, {
    headers: { 'Content-Type': undefined },
  }),
  update: (id, data) => apiClient.patch(`/transactions/${id}`, data),
  delete: (id) => apiClient.delete(`/transactions/${id}`),
  getSummary: (params = {}) => apiClient.get('/transactions/sumary', { params }),
  getCategoryBreakdown: (params = {}) => apiClient.get('/transactions/category-breakdown', { params }),
  getDailySpending: () => apiClient.get('/transactions/daily-spending'),
};
