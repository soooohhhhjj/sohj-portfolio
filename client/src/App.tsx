import { motion } from 'framer-motion';
import { Hero } from './features/hero/components/Hero';
import { useIntroSequence } from './features/homepage/hooks/useIntroSequence';
import { RelevantExperiences } from './features/relevant-experiences/components/RelevantExperiences';
import { Skills } from './features/skills/components/Skills';
import { Welcome } from './features/welcome/components/Welcome';
import { useResponsiveTokens } from './shared/hooks/useResponsiveTokens';
import { StarfieldBackground } from './shared/components/StarfieldBackground';
import { useScrollVelocity } from './shared/hooks/useScrollVelocity';
import { Footer } from './shared/layouts/Footer';
import { Navbar } from './shared/layouts/Navbar';

type StarMode = 'normal' | 'horizontal' | 'vertical' | 'paused' | 'cinematic' | 'forward';
const STARFIELD_ENABLED_STORAGE_KEY = 'sohj.debug.starfield.enabled';
const PERF_LITE_ENABLED_STORAGE_KEY = 'sohj.debug.perfLite.enabled';

function PortfolioExperience({
  isStarfieldEnabled,
  isPerfLiteEnabled,
  replayKey,
}: {
  isStarfieldEnabled: boolean;
  isPerfLiteEnabled: boolean;
  replayKey: number;
}) {
  useResponsiveTokens();
  const {
    hasWelcomeFinished,
    hasHeroFinished,
    hasIntroFinished,
    setHasWelcomeFinished,
    setHasHeroFinished,
  } = useIntroSequence();
  useScrollVelocity(hasIntroFinished);
  const starMode: StarMode =
    !hasWelcomeFinished ? 'normal' : !hasHeroFinished ? 'cinematic' : 'normal';

  return (
    <div key={replayKey} className={`app-shell ${isPerfLiteEnabled ? 'perf-debug-lite' : ''}`}>
      {isStarfieldEnabled ? <StarfieldBackground mode={starMode} /> : null}
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
          <RelevantExperiences
            editorEnabled={false}
            shouldAnimate={hasWelcomeFinished}
          />
        </div>

        <div className="relative z-[1]">
          <Skills
            editorEnabled={false}
            shouldAnimate={hasWelcomeFinished}
          />
        </div>

        <Footer />
      </main>
    </div>
  );
}

export function App() {
  const isStarfieldEnabled =
    typeof window === 'undefined'
      ? true
      : (window.localStorage.getItem(STARFIELD_ENABLED_STORAGE_KEY) ?? 'true') === 'true';
  const isPerfLiteEnabled =
    typeof window === 'undefined'
      ? false
      : (window.localStorage.getItem(PERF_LITE_ENABLED_STORAGE_KEY) ?? 'false') === 'true';
  const introReplayKey = 0;

  return (
    <PortfolioExperience
      isStarfieldEnabled={isStarfieldEnabled}
      isPerfLiteEnabled={isPerfLiteEnabled}
      replayKey={introReplayKey}
    />
  );
}
