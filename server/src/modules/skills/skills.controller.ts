import type { Request, Response } from 'express';
import { getSkillsContentState, saveSkillsContentState } from './skills.service.js';

export async function getSkillsContentController(_req: Request, res: Response) {
  const content = await getSkillsContentState();

  if (!content) {
    res.status(404).json({ message: 'Skills content not found.' });
    return;
  }

  res.status(200).json(content);
}

export async function saveSkillsContentController(req: Request, res: Response) {
  try {
    const content = await saveSkillsContentState(req.body);

    if (!content) {
      res.status(400).json({ message: 'Invalid skills content payload.' });
      return;
    }

    res.status(200).json(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save skills content.';
    res.status(400).json({ message });
  }
}
