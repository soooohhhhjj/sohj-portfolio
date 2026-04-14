import { motion } from 'framer-motion';
import { Hero } from './features/hero/components/Hero';
import { useIntroSequence } from './features/homepage/hooks/useIntroSequence';
import { RelevantExperiences } from './features/relevant-experiences/components/RelevantExperiences';
import { Welcome } from './features/welcome/components/Welcome';
import { useResponsiveTokens } from './shared/hooks/useResponsiveTokens';
import { Navbar } from './shared/layouts';
import { StarfieldBackground } from './shared/components/StarfieldBackground';
import { useScrollVelocity } from './shared/hooks/useScrollVelocity';

type StarMode = 'normal' | 'horizontal' | 'vertical' | 'paused' | 'cinematic' | 'forward';

export function App() {
  const { hasWelcomeFinished, hasHeroFinished, hasIntroFinished, setHasWelcomeFinished, setHasHeroFinished } =
    useIntroSequence();

  useResponsiveTokens();
  useScrollVelocity(hasIntroFinished);

  const starMode: StarMode =
    !hasWelcomeFinished ? 'normal' : !hasHeroFinished ? 'cinematic' : 'normal';

  return (
    <div className="app-shell">
      <StarfieldBackground mode={starMode} />
      <main className="app-content">
        <motion.div
          className="fixed inset-0 z-[60] w-full will-change-transform"
          initial={{ y: 0 }}
          animate={{ y: hasWelcomeFinished ? '-100vh' : 0 }}
          transition={{ duration: 1, ease: [0.12, 0.7, 0.63, 0.9] }}
        >
          <Welcome onAnimationComplete={() => setHasWelcomeFinished(true)} />
        </motion.div>

        <Navbar shouldAnimate={hasWelcomeFinished} />

        <div className="relative z-[1]" id="hero-section">
          <Hero
            shouldAnimate={hasWelcomeFinished}
            onAnimationsComplete={() => setHasHeroFinished(true)}
          />
        </div>

        <div className="relative z-[1]" id="relevant-experiences-section">
          <RelevantExperiences />
        </div>
      </main>
    </div>
  );
}
