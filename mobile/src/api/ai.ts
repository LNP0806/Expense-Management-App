import apiClient from './client';

export const aiApi = {
  parseTransaction: (text: string) => apiClient.post('/ai/parse-transaction', { text }),
};
