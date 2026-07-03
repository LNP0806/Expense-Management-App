import apiClient from './client';

export const aiApi = {
  parseTransaction: (text) => apiClient.post('/ai/parse-transaction', { text }),
};
