import type { SkillsContentState } from '../types/skills.types';

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Request failed.');
  }

  return payload as T;
}

export async function getSkillsContent() {
  const response = await fetch('/api/skills', {
    method: 'GET',
  });

  return parseJsonResponse<SkillsContentState>(response);
}

export async function saveSkillsContent(payload: SkillsContentState) {
  const response = await fetch('/api/admin/skills', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<SkillsContentState>(response);
}
