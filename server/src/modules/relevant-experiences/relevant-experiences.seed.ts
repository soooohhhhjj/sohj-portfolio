type RelevantExperienceNodeType = 'parent' | 'child';
type RelevantExperienceIcon = 'briefcase-business' | 'folder-kanban';

type RelevantExperiencesContentState = {
  nodes: Array<{
    id: string;
    type: RelevantExperienceNodeType;
    parentId?: string;
    title: string;
    subtitle?: string;
    details: string;
    modalWhatIDid?: string[];
    previewTags?: string[];
    modalTags?: string[];
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
      subtitle: 'Internship Experience',
      details:
        'Hands-on technical work that shaped my practical understanding of IT operations, support, and real-world troubleshooting.',
      modalWhatIDid: [
        'Worked on real support-related tasks across troubleshooting, maintenance, and setup activities.',
        'Handled tasks that required technical accuracy, responsiveness, and clear documentation.',
        'Built practical confidence in solving issues outside purely classroom-based exercises.',
      ],
      icon: 'briefcase-business',
      layout: { x: 60, y: 0, width: 315, height: 243 },
    },
    {
      id: 'nc2-certificate',
      type: 'child',
      parentId: 'it-experiences',
      title: 'NCII Certificate',
      subtitle: 'Formal Training',
      details:
        'Formal IT training focused on servicing, installation, and core networking fundamentals.',
      modalWhatIDid: [
        'Practiced computer servicing and installation procedures.',
        'Learned basic network setup and core troubleshooting fundamentals.',
        'Built a stronger foundation for handling real support-related tasks.',
      ],
      previewTags: ['Installation', 'Configuration', 'Basic Networking'],
      modalTags: ['Installation', 'Configuration', 'Basic Networking'],
      image: '/Journey/node2/nc2-certi.PNG',
      layout: { x: 555, y: 0, width: 315, height: 243 },
    },
    {
      id: 'transfer-it-internship',
      type: 'child',
      parentId: 'it-experiences',
      title: 'Transfer It Internship Experience',
      subtitle: 'IT Internship Experience',
      details:
        'Internship exposure across support, maintenance, inventory, and operational workflows in a real company setup.',
      modalWhatIDid: [
        'Assisted with hardware maintenance, printer troubleshooting, driver installation, and OS setup tasks.',
        'Supported remote technical assistance and responded to practical operational issues.',
        'Handled inventory-related work and helped maintain documentation for ongoing processes.',
        'Observed and contributed across departments to understand broader workflow coordination.',
      ],
      previewTags: ['Hardware Maintenance', 'Troubleshooting', 'OS Setup'],
      modalTags: ['Hardware Maintenance', 'Troubleshooting', 'OS Setup', 'Remote Support', 'Documentation'],
      image: '/Journey/node4/tit-logo.png',
      layout: { x: 60, y: 360, width: 315, height: 243 },
    },
    {
      id: 'dev-academic-projects',
      type: 'parent',
      title: 'Dev Academic Projects',
      subtitle: 'Academic System Builds',
      details:
        'Projects where I applied development skills to larger academic systems, architecture decisions, and team-based delivery.',
      modalWhatIDid: [
        'Worked on end-to-end system thinking across planning, architecture, and implementation.',
        'Handled development tasks tied to data flow, integration, and academic project delivery.',
        'Learned how project decisions affect stability, scalability, and team execution.',
      ],
      icon: 'folder-kanban',
      layout: { x: 555, y: 360, width: 315, height: 243 },
    },
    {
      id: 'system-architecture-thesis',
      type: 'child',
      parentId: 'dev-academic-projects',
      title: 'System Architecture Thesis',
      subtitle: 'Inventory Management System',
      details:
        'Inventory management thesis project centered on system structure, data flow, and implementation.',
      modalWhatIDid: [
        'Built the system end-to-end using HTML, CSS, JavaScript, PHP, and MySQL.',
        'Designed the database structure, workflows, and overall system architecture.',
        'Implemented core features for inventory handling and supporting data flow.',
        'Prepared dynamic data generation to simulate multi-year records for presentation and analytics.',
      ],
      previewTags: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL'],
      modalTags: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL', 'Architecture'],
      image: '/Journey/node4/sysarch.PNG',
      layout: { x: 180, y: 720, width: 315, height: 243 },
    },
    {
      id: 'capstone-thesis',
      type: 'child',
      parentId: 'dev-academic-projects',
      title: 'Capstone Thesis',
      subtitle: 'Department Screening System',
      details:
        'Academic system project focused on debugging, integration support, and improving project stability.',
      modalWhatIDid: [
        'Assisted with debugging logic issues and unintended system behavior.',
        'Supported integration-related fixes and minor database connection issues.',
        'Contributed during planning and stabilization efforts to help keep the project moving.',
      ],
      previewTags: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL'],
      modalTags: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL', 'Integration'],
      image: '/Journey/node4/capstone-thesis.png',
      layout: { x: 555, y: 1040, width: 315, height: 243 },
    },
  ],
  connections: [],
};
