import { Router } from 'express';
import { requireAdminAuth } from '../admin-auth/admin.middleware.js';
import {
  getRelevantExperiencesContentController,
  saveRelevantExperiencesContentController,
} from './relevant-experiences.controller.js';

export const relevantExperiencesRouter = Router();
export const adminRelevantExperiencesRouter = Router();

relevantExperiencesRouter.get('/', getRelevantExperiencesContentController);

adminRelevantExperiencesRouter.put(
  '/',
  requireAdminAuth,
  saveRelevantExperiencesContentController,
);
