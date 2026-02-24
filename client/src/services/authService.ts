import { api } from './api';

export const authService = {
  login: (payload: { email: string; password: string }) =>
    api<{ message: string }>('/auth/login', {
      method: 'POST',
      body: payload,
    }),
};