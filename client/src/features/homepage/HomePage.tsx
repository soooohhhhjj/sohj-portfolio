import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useHomeIntroFlow } from './hooks/useHomeIntroFlow';
import { Welcome } from './components/Welcome';
import { Hero } from './components/Hero';
import { JourneyTitle } from './components/JourneyTitle';
import { SkillsTitle } from './components/SkillsTitle';

type StarMode = 'normal' | 'horizontal' | 'vertical' | 'paused' | 'cinematic' | 'forward';

interface HomePageProps {
  setStarMode: (mode: StarMode) => void;
  onWelcomeFinishedChange: (isFinished: boolean) => void;
  onIntroFinishedChange: (isFinished: boolean) => void;
}

const HERO_ANIMATION_LEAD_DELAY_MS = 60;

export function HomePage({
  setStarMode,
  onWelcomeFinishedChange,
  onIntroFinishedChange,
}: HomePageProps) {
  const [hasHeroAnimationStarted, setHasHeroAnimationStarted] = useState(false);
  const { hasWelcomeFinished, setHasWelcomeFinished, hasHeroFinished, setHasHeroFinished, hasIntroFinished } =
    useHomeIntroFlow();

  useEffect(() => {
    onWelcomeFinishedChange(hasWelcomeFinished);
  }, [hasWelcomeFinished, onWelcomeFinishedChange]);

  useEffect(() => {
    onIntroFinishedChange(hasIntroFinished);
  }, [hasIntroFinished, onIntroFinishedChange]);

  useEffect(() => {
    if (!hasWelcomeFinished) return;

    const timer = window.setTimeout(() => {
      setHasHeroAnimationStarted(true);
    }, HERO_ANIMATION_LEAD_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [hasWelcomeFinished]);

  useEffect(() => {
    if (!hasWelcomeFinished) {
      setStarMode('normal');
      return;
    }

    if (!hasHeroFinished) {
      setStarMode('cinematic');
      return;
    }

    setStarMode('normal');
  }, [hasWelcomeFinished, hasHeroFinished, setStarMode]);

  return (
    <section className="homepage">
      <motion.div
        className="homepage__welcome-layer"
        initial={{ y: 0 }}
        animate={{ y: hasWelcomeFinished ? '-100vh' : 0 }}
        transition={{ duration: 1, ease: [0.12, 0.7, 0.63, 0.9] }}
      >
        <Welcome onAnimationComplete={() => setHasWelcomeFinished(true)} />
      </motion.div>

      <div className="homepage__content">
        <div id="hero-section">
          <Hero
            shouldAnimate={hasHeroAnimationStarted}
            onAnimationsComplete={() => setHasHeroFinished(true)}
          />
        </div>

        <div id="journey-section">
          <JourneyTitle show={hasIntroFinished} />
        </div>

        <div id="tech-stack-section">
          <SkillsTitle show={hasIntroFinished} />
        </div>
      </div>
    </section>
  );
}
