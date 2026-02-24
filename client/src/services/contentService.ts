import { api } from './api';

export const contentService = {
  list: () => api<{ message: string }>('/content'),
};