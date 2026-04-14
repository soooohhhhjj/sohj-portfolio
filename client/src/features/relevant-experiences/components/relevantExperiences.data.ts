import { BriefcaseBusiness, FolderKanban } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

export type RelevantExperienceChild = {
  id: string;
  title: string;
  details: string;
  image: string;
};

export type RelevantExperienceParent = {
  id: string;
  title: string;
  intro: string;
  icon: LucideIcon;
  children: RelevantExperienceChild[];
};

export const relevantExperiences: RelevantExperienceParent[] = [
  {
    id: 'it-experiences',
    title: 'IT Experiences',
    intro:
      'Hands-on technical work that shaped my practical understanding of IT operations, support, and real-world troubleshooting.',
    icon: BriefcaseBusiness,
    children: [
      {
        id: 'nc2-certificate',
        title: 'NCII Certificate',
        details: 'Formal IT training focused on servicing, installation, and core networking fundamentals.',
        image: asset('/Journey/node2/nc2-certi.PNG'),
      },
      {
        id: 'transfer-it-internship',
        title: 'Transfer It Internship Experience',
        details:
          'Internship exposure across support, maintenance, inventory, and operational workflows in a real company setup.',
        image: asset('/Journey/node4/tit-logo.png'),
      },
    ],
  },
  {
    id: 'dev-academic-projects',
    title: 'Dev Academic Projects',
    intro:
      'Projects where I applied development skills to larger academic systems, architecture decisions, and team-based delivery.',
    icon: FolderKanban,
    children: [
      {
        id: 'system-architecture-thesis',
        title: 'System Architecture Thesis',
        details:
          'Inventory management thesis project centered on system structure, data flow, and implementation.',
        image: asset('/Journey/node4/sysarch.PNG'),
      },
      {
        id: 'capstone-thesis',
        title: 'Capstone Thesis',
        details:
          'Academic system project focused on debugging, integration support, and improving project stability.',
        image: asset('/Journey/node4/capstone-thesis.png'),
      },
    ],
  },
];
