import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useHomeIntroFlow } from './hooks/useHomeIntroFlow';
import { Welcome } from './components/Welcome';
import { Hero } from './components/Hero';
import Journey from './components/Journey';
import { SkillsTitle } from './components/SkillsTitle';
import { Navbar } from '../../shared/layouts';

type StarMode = 'normal' | 'horizontal' | 'vertical' | 'paused' | 'cinematic' | 'forward';

interface HomePageProps {
  setStarMode: (mode: StarMode) => void;
  onIntroFinishedChange: (isFinished: boolean) => void;
}

export function HomePage({
  setStarMode,
  onIntroFinishedChange,
}: HomePageProps) {
  const { hasWelcomeFinished, setHasWelcomeFinished, hasHeroFinished, setHasHeroFinished, hasIntroFinished } =
    useHomeIntroFlow();

  useEffect(() => {
    onIntroFinishedChange(hasIntroFinished);
  }, [hasIntroFinished, onIntroFinishedChange]);

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
        <Navbar shouldAnimate={hasWelcomeFinished} />
        <div id="hero-section">
          <Hero
            shouldAnimate={hasWelcomeFinished}
            onAnimationsComplete={() => setHasHeroFinished(true)}
          />
        </div>

        <div id="journey-section">
          <Journey shouldShow={hasIntroFinished} />
        </div>

        <div id="tech-stack-section">
          <SkillsTitle show={hasIntroFinished} />
        </div>
      </div>
    </section>
  );
}
