import { relevantExperiencesContentData } from '../data/relevantExperiences.data';
import type { RelevantExperiencesContentState } from '../components/relevantExperiences.types';

export async function getRelevantExperiencesContent() {
  return structuredClone(relevantExperiencesContentData);
}

export async function saveRelevantExperiencesContent(payload: RelevantExperiencesContentState) {
  void payload;
  return Promise.reject(new Error('Editing is disabled in the static portfolio build.'));
}
