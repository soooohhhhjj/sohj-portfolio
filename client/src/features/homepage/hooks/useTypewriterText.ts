import { useEffect, useRef, useState } from 'react';

export function useTypewriterText(text: string, speedMs: number) {
  const [displayed, setDisplayed] = useState('');
  const [isDone, setIsDone] = useState(false);

  const indexRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplayed('');
    setIsDone(false);
    indexRef.current = 0;

    const tick = () => {
      const i = indexRef.current;
      if (i >= text.length) {
        setIsDone(true);
        timeoutRef.current = null;
        return;
      }

      setDisplayed((prev) => prev + text.charAt(i));
      indexRef.current += 1;
      timeoutRef.current = window.setTimeout(tick, speedMs);
    };

    timeoutRef.current = window.setTimeout(tick, speedMs);
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speedMs]);

  return { displayed, isDone };
}

