import { useEffect, useRef, useState } from 'react';
import { Section, SectionContent } from '../../../shared/components/Container';

interface WelcomeProps {
  onAnimationComplete: () => void;
}

export function Welcome({ onAnimationComplete }: WelcomeProps) {
  const text = 'Welcome to My Portfolio Website.😊';
  const speed = 40;

  const [displayed, setDisplayed] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);

  const indexRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const i = indexRef.current;
      if (i >= text.length) {
        setIsTypingDone(true);
        timeoutRef.current = null;
        return;
      }

      setDisplayed((prev) => prev + text.charAt(i));
      indexRef.current += 1;
      timeoutRef.current = window.setTimeout(tick, speed);
    };

    timeoutRef.current = window.setTimeout(tick, speed);
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed]);

  useEffect(() => {
    if (isTypingDone) {
      const timer = window.setTimeout(() => {
        onAnimationComplete();
      }, 500);
      return () => window.clearTimeout(timer);
    }
  }, [isTypingDone, onAnimationComplete]);

  return (
    <Section className="w-full h-screen flex items-center justify-center">
      <SectionContent className="section-content center-div responsiveness text-center">
        <span
          className="font-jura text-[23px] sm:text-[24px] md:text-[28px] lg:text-[30px] tracking-[.09rem] font-[500] text-white"
        >
          {displayed}
          <span className={`caret ${isTypingDone ? 'blink' : ''}`} />
        </span>
      </SectionContent>
    </Section>
  );
}
