import { Router } from 'express';
import { requireAdminAuth } from '../admin-auth/admin.middleware.js';
import {
  getSkillsContentController,
  saveSkillsContentController,
} from './skills.controller.js';

export const skillsRouter = Router();
export const adminSkillsRouter = Router();

skillsRouter.get('/', getSkillsContentController);

adminSkillsRouter.put('/', requireAdminAuth, saveSkillsContentController);
