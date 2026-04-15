import type { Request, Response } from 'express';
import {
  getRelevantExperiencesContentState,
  saveRelevantExperiencesContentState,
} from './relevant-experiences.service.js';

export async function getRelevantExperiencesContentController(_req: Request, res: Response) {
  const content = await getRelevantExperiencesContentState();
  res.status(200).json(content);
}

export async function saveRelevantExperiencesContentController(req: Request, res: Response) {
  const content = await saveRelevantExperiencesContentState(req.body);
  res.status(200).json(content);
}
