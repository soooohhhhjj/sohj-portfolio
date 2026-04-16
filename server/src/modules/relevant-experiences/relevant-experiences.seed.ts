type RelevantExperienceNodeType = 'parent' | 'child';
type RelevantExperienceIcon = 'briefcase-business' | 'folder-kanban';

type RelevantExperiencesContentState = {
  nodes: Array<{
    id: string;
    type: RelevantExperienceNodeType;
    parentId?: string;
    title: string;
    details: string;
    tags?: string[];
    image?: string;
    icon?: RelevantExperienceIcon;
    layout: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  connections: Array<{
    id: string;
    from: string;
    to: string;
    fromAnchor: 'top' | 'right' | 'bottom' | 'left';
    toAnchor: 'top' | 'right' | 'bottom' | 'left';
    viaPoints: Array<{
      x: number;
      y: number;
    }>;
    variant: 'group' | 'detail';
  }>;
};

export const relevantExperiencesSeedState: RelevantExperiencesContentState = {
  nodes: [
    {
      id: 'it-experiences',
      type: 'parent',
      title: 'IT Experiences',
      details:
        'Hands-on technical work that shaped my practical understanding of IT operations, support, and real-world troubleshooting.',
      icon: 'briefcase-business',
      layout: { x: 60, y: 0, width: 315, height: 243 },
    },
    {
      id: 'nc2-certificate',
      type: 'child',
      parentId: 'it-experiences',
      title: 'NCII Certificate',
      details:
        'Formal IT training focused on servicing, installation, and core networking fundamentals.',
      tags: ['Installation', 'Configuration', 'Basic Networking'],
      image: '/Journey/node2/nc2-certi.PNG',
      layout: { x: 555, y: 0, width: 315, height: 243 },
    },
    {
      id: 'transfer-it-internship',
      type: 'child',
      parentId: 'it-experiences',
      title: 'Transfer It Internship Experience',
      details:
        'Internship exposure across support, maintenance, inventory, and operational workflows in a real company setup.',
      tags: ['Hardware Maintenance', 'Troubleshooting', 'OS Setup', 'Remote Support', 'Documentation'],
      image: '/Journey/node4/tit-logo.png',
      layout: { x: 60, y: 360, width: 315, height: 243 },
    },
    {
      id: 'dev-academic-projects',
      type: 'parent',
      title: 'Dev Academic Projects',
      details:
        'Projects where I applied development skills to larger academic systems, architecture decisions, and team-based delivery.',
      icon: 'folder-kanban',
      layout: { x: 555, y: 360, width: 315, height: 243 },
    },
    {
      id: 'system-architecture-thesis',
      type: 'child',
      parentId: 'dev-academic-projects',
      title: 'System Architecture Thesis',
      details:
        'Inventory management thesis project centered on system structure, data flow, and implementation.',
      tags: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL', 'Architecture'],
      image: '/Journey/node4/sysarch.PNG',
      layout: { x: 180, y: 720, width: 315, height: 243 },
    },
    {
      id: 'capstone-thesis',
      type: 'child',
      parentId: 'dev-academic-projects',
      title: 'Capstone Thesis',
      details:
        'Academic system project focused on debugging, integration support, and improving project stability.',
      tags: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL', 'Integration'],
      image: '/Journey/node4/capstone-thesis.png',
      layout: { x: 555, y: 1040, width: 315, height: 243 },
    },
  ],
  connections: [],
};
