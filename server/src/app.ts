import express from 'express';
import { adminAuthRouter } from './modules/admin-auth/admin.routes.js';

export const app = express();

app.use(express.json());

app.use('/api/admin/auth', adminAuthRouter);

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Clean server baseline is running.',
  });
});
