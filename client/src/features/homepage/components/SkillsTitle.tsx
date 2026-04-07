import { motion } from 'framer-motion';
import { Section, SectionContent } from '../../../shared/components/Container';
import './SkillsTitle.css';

interface SkillsTitleProps {
  show: boolean;
}

export function SkillsTitle({ show }: SkillsTitleProps) {
  return (
    <Section className="skills-section" >
      <SectionContent className="skills-content">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: show ? 1 : 0, y: show ? 0 : 40 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="skills-title"
        >
          Skills
        </motion.h2>
      </SectionContent>
    </Section>
  );
}
