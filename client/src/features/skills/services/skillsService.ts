import { skillsContentData } from '../data/skills.data';
import type { SkillsContentState } from '../types/skills.types';

export async function getSkillsContent() {
  return structuredClone(skillsContentData);
}

export async function saveSkillsContent(payload: SkillsContentState) {
  void payload;
  return Promise.reject(new Error('Editing is disabled in the static portfolio build.'));
}
