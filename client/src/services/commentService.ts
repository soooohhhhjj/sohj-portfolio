import { api } from './api';

export const commentService = {
  list: () => api<{ message: string }>('/comments'),
};