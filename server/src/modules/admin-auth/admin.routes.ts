import { Router } from 'express';
import {
  getAdminSessionController,
  loginAdminController,
  logoutAdminController,
} from './admin.controller.js';
import { limitAdminLoginAttempts } from './admin.rate-limit.js';
import { requireAdminAuth } from './admin.middleware.js';

export const adminAuthRouter = Router();

adminAuthRouter.post('/login', limitAdminLoginAttempts, loginAdminController);
adminAuthRouter.post('/logout', logoutAdminController);
adminAuthRouter.get('/me', requireAdminAuth, getAdminSessionController);
