import { useEffect } from 'react';
import { Section, SectionContent } from '../../../shared/components/Container';
import { useTypewriterText } from '../hooks/useTypewriterText';
import './Welcome.css';

interface WelcomeProps {
  onAnimationComplete: () => void;
}

export function Welcome({ onAnimationComplete }: WelcomeProps) {
  const { displayed, isDone } = useTypewriterText('Welcome to My Portfolio Website.😊', 40);

  useEffect(() => {
    if (isDone) {
      const timer = window.setTimeout(() => {
        onAnimationComplete();
      }, 500);
      return () => window.clearTimeout(timer);
    }
  }, [isDone, onAnimationComplete]);

  return (
    <Section className="w-full h-screen flex items-center justify-center">
      <SectionContent className="section-content center-div responsiveness text-center">
        <span
          className="font-jura text-[23px] sm:text-[24px] md:text-[28px] lg:text-[30px] tracking-[.09rem] font-[500] base-text-color"
        >
          {displayed}
          <span
            className={`inline-block ml-1 w-[2px] h-[1.35em] bg-[color:var(--base-text-color)] align-bottom translate-y-[-2px] ${isDone ? 'caret-blink' : ''}`}
          />
        </span>
      </SectionContent>
    </Section>
  );
}
