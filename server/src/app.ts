import express from 'express';
import { adminAuthRouter } from './modules/admin-auth/admin.routes.js';
import {
  adminRelevantExperiencesRouter,
  relevantExperiencesRouter,
} from './modules/relevant-experiences/relevant-experiences.routes.js';
import { adminSkillsRouter, skillsRouter } from './modules/skills/skills.routes.js';

export const app = express();

app.use(express.json());

app.use('/api/admin/auth', adminAuthRouter);
app.use('/api/admin/relevant-experiences', adminRelevantExperiencesRouter);
app.use('/api/admin/skills', adminSkillsRouter);
app.use('/api/relevant-experiences', relevantExperiencesRouter);
app.use('/api/skills', skillsRouter);

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Clean server baseline is running.',
  });
});
