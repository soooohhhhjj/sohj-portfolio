import { motion } from 'framer-motion';
import { Section, SectionContent } from '../../../shared/components/Container';

interface JourneyTitleProps {
  show: boolean;
}

export function JourneyTitle({ show }: JourneyTitleProps) {
  return (
    <Section className="journey-section">
      <SectionContent className="journey-content">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: show ? 1 : 0, y: show ? 0 : 40 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="journey-title"
        >
          Journey
        </motion.h2>
      </SectionContent>
    </Section>
  );
}
