import { BriefcaseBusiness, FolderKanban } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RelevantExperienceIcon } from './relevantExperiences.types';

const iconMap: Record<RelevantExperienceIcon, LucideIcon> = {
  'briefcase-business': BriefcaseBusiness,
  'folder-kanban': FolderKanban,
};

export function getRelevantExperienceIcon(icon?: RelevantExperienceIcon) {
  return icon ? iconMap[icon] : undefined;
}
