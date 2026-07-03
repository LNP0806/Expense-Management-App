import apiClient from './client';

export const transactionsApi = {
  getAll: (params = {}) => apiClient.get('/transactions', { params }),
  getById: (id) => apiClient.get(`/transactions/${id}`),
  create: (formData) => apiClient.post('/transactions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => apiClient.patch(`/transactions/${id}`, data),
  delete: (id) => apiClient.delete(`/transactions/${id}`),
};
