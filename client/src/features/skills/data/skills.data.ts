import type { SkillsContentState } from '../types/skills.types';

export const skillsContentData: SkillsContentState = {
  title: 'Skills',
  intro:
    "These are the stacks I'm currently working on and using. Click a card to flip it and see some of the other tools I've used before as well.",
  cards: [
    {
      id: 'frontend',
      title: 'Frontend',
      frontLabel: 'Currently Using',
      backLabel: 'Used Before',
      currentStacks: [
        { id: 'react', name: 'React', icon: 'react' },
        { id: 'typescript', name: 'TypeScript', icon: 'typescript' },
        { id: 'tailwindcss', name: 'Tailwind CSS', icon: 'tailwindcss' },
      ],
      previousStacks: [
        { id: 'javascript', name: 'JavaScript', icon: 'javascript' },
        { id: 'html', name: 'HTML', icon: 'html5' },
        { id: 'css', name: 'CSS', icon: 'css3' },
        { id: 'bootstrap', name: 'Bootstrap', icon: 'bootstrap' },
      ],
      layout: { x: 186, y: 112, width: 462, height: 220 },
    },
    {
      id: 'backend',
      title: 'Backend',
      frontLabel: 'Currently Using',
      backLabel: 'Used Before',
      currentStacks: [
        { id: 'nodejs', name: 'Node.js', icon: 'nodejs' },
        { id: 'express', name: 'Express.js', icon: 'express' },
      ],
      previousStacks: [
        { id: 'php', name: 'PHP', icon: 'php' },
        { id: 'firebase', name: 'Firebase', icon: 'firebase' },
      ],
      layout: { x: 688, y: 98, width: 293, height: 220 },
    },
    {
      id: 'database',
      title: 'Database',
      frontLabel: 'Currently Using',
      backLabel: 'Used Before',
      currentStacks: [
        { id: 'mongodb', name: 'MongoDB', icon: 'mongodb' },
        { id: 'mongoose', name: 'Mongoose', icon: 'mongoose' },
      ],
      previousStacks: [
        { id: 'mysql', name: 'MySQL', icon: 'mysql' },
        { id: 'firebase-db', name: 'Firebase', icon: 'firebase' },
      ],
      layout: { x: 169, y: 371, width: 298, height: 220 },
    },
    {
      id: 'tools',
      title: 'Tools',
      frontLabel: 'Currently Using',
      backLabel: 'Used Before',
      currentStacks: [
        { id: 'vscode', name: 'VS Code', icon: 'vscode' },
        { id: 'github', name: 'GitHub', icon: 'github' },
      ],
      previousStacks: [
        { id: 'android-studio', name: 'Android Studio', icon: 'androidstudio' },
        { id: 'java', name: 'Java', icon: 'java' },
        { id: 'python', name: 'Python', icon: 'python' },
        { id: 'cpp', name: 'C++', icon: 'cpp' },
      ],
      layout: { x: 506, y: 358, width: 462, height: 220 },
    },
  ],
  mdLayout: {
    cards: [
      { id: 'frontend', layout: { x: 218, y: 102, width: 420, height: 220 } },
      { id: 'backend', layout: { x: 661, y: 132, width: 260, height: 220 } },
      { id: 'database', layout: { x: 237, y: 346, width: 260, height: 220 } },
      { id: 'tools', layout: { x: 522, y: 376, width: 420, height: 220 } },
    ],
  },
  lines: [],
  titleLayout: { x: 335, y: 13 },
};
