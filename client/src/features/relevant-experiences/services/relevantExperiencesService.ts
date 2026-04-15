import type { RelevantExperiencesContentState } from '../components/relevantExperiences.types';

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Request failed.');
  }

  return payload as T;
}

export async function getRelevantExperiencesContent() {
  const response = await fetch('/api/relevant-experiences', {
    method: 'GET',
  });

  return parseJsonResponse<RelevantExperiencesContentState>(response);
}

export async function saveRelevantExperiencesContent(payload: RelevantExperiencesContentState) {
  const response = await fetch('/api/admin/relevant-experiences', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<RelevantExperiencesContentState>(response);
}
