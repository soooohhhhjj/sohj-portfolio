import type { LucideIcon } from 'lucide-react';
import { Github, Linkedin, Mail } from 'lucide-react';

export const FOOTER_META = {
  name: 'sohj.abe',
  role: 'Full-Stack Developer',
  tagline: 'Building pixel-perfect interactive websites.',
};

export const FOOTER_LINKS = [
  { label: 'Hero', sectionId: 'home-top' },
  { label: 'My Journey', sectionId: 'journey-section' },
  { label: 'My Tech Stack', sectionId: 'tech-stack-section' },
];

export type FooterSocial = {
  label: string;
  href: string;
  Icon: LucideIcon;
};

export const FOOTER_SOCIALS: FooterSocial[] = [
  { label: 'GitHub', href: 'https://github.com/soooohhhhjj', Icon: Github },
  {
    label: 'LinkedIn',
    href: 'http://linkedin.com/in/carlojoshua-abellera',
    Icon: Linkedin,
  },
  {
    label: 'Email',
    href: 'mailto:carlojoshua.abellera.ph@gmail.com',
    Icon: Mail,
  },
];
