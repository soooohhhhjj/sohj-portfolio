import { useEffect, useRef, useState } from 'react';
import './Welcome.css';

interface WelcomeProps {
  onAnimationComplete?: () => void;
}

const WELCOME_TEXT = 'Welcome to My Portfolio Website.\u{1F60A}';
const TYPING_SPEED = 40;
const COMPLETE_DELAY = 500;

export function Welcome({ onAnimationComplete }: WelcomeProps) {
  const [displayed, setDisplayed] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);

  const indexRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const index = indexRef.current;

      if (index >= WELCOME_TEXT.length) {
        setIsTypingDone(true);
        timeoutRef.current = null;
        return;
      }

      setDisplayed((previous) => previous + WELCOME_TEXT.charAt(index));
      indexRef.current += 1;
      timeoutRef.current = window.setTimeout(tick, TYPING_SPEED);
    };

    timeoutRef.current = window.setTimeout(tick, TYPING_SPEED);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isTypingDone || !onAnimationComplete) {
      return;
    }

    const timer = window.setTimeout(() => {
      onAnimationComplete();
    }, COMPLETE_DELAY);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isTypingDone, onAnimationComplete]);

  return (
    <section
      className="flex items-center justify-center w-full h-screen 
      px-4 sm:px-6 lg:px-8"
    >
      <div
        className="
          w-full text-center text-[23px] font-medium tracking-[0.09rem] text-[rgb(247,247,217)]
          sm:text-[24px] md:text-[28px] lg:text-[30px]
        "
        style={{ fontFamily: "'Jura', sans-serif" }}
      >
        {displayed}
        <span
          className={`welcome-caret ${isTypingDone ? 'welcome-caret--blink' : ''}`}
        />
      </div>
    </section>
  );
}
