import apiClient from './client';

export const transactionsApi = {
  getAll: (params = {}) => apiClient.get('/transactions', { params }),
  getById: (id: string) => apiClient.get(`/transactions/${id}`),
  create: (formData: FormData) => apiClient.post('/transactions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  update: (id: string, data: any) => apiClient.patch(`/transactions/${id}`, data),
  delete: (id: string) => apiClient.delete(`/transactions/${id}`),
};
