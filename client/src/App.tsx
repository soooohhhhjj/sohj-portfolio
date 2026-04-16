import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { AdminLogin } from './features/admin-auth/components/AdminLogin';
import { getAdminSession, logoutAdmin } from './features/admin-auth/services/adminAuthService';
import { Hero } from './features/hero/components/Hero';
import { useIntroSequence } from './features/homepage/hooks/useIntroSequence';
import { RelevantExperiences } from './features/relevant-experiences/components/RelevantExperiences';
import { Welcome } from './features/welcome/components/Welcome';
import { BreakpointDebugOverlay } from './shared/components/BreakpointDebugOverlay';
import { useResponsiveTokens } from './shared/hooks/useResponsiveTokens';
import { StarfieldBackground } from './shared/components/StarfieldBackground';
import { useScrollVelocity } from './shared/hooks/useScrollVelocity';
import { Navbar } from './shared/layouts';

type StarMode = 'normal' | 'horizontal' | 'vertical' | 'paused' | 'cinematic' | 'forward';
const STARFIELD_ENABLED_STORAGE_KEY = 'sohj.debug.starfield.enabled';
const PERF_LITE_ENABLED_STORAGE_KEY = 'sohj.debug.perfLite.enabled';
const RELEVANT_EXPERIENCES_EDITOR_STORAGE_KEY = 'sohj.debug.relevantExperiences.editor.enabled';
const ADMIN_LOGIN_KEY = 'l';
const buildAdminLoginUrl = (redirectPath: string) =>
  `/admin/login?redirect=${encodeURIComponent(redirectPath)}`;

function PortfolioExperience({
  isStarfieldEnabled,
  isPerfLiteEnabled,
  isRelevantExperiencesEditorEnabled,
  replayKey,
}: {
  isStarfieldEnabled: boolean;
  isPerfLiteEnabled: boolean;
  isRelevantExperiencesEditorEnabled: boolean;
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
            editorEnabled={isRelevantExperiencesEditorEnabled}
            shouldAnimate={hasWelcomeFinished}
          />
        </div>
      </main>
    </div>
  );
}

export function App() {
  const pathname = window.location.pathname;
  const [isStarfieldEnabled, setIsStarfieldEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem(STARFIELD_ENABLED_STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  });
  const [isPerfLiteEnabled, setIsPerfLiteEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = window.localStorage.getItem(PERF_LITE_ENABLED_STORAGE_KEY);
    return saved === null ? false : saved === 'true';
  });
  const [isRelevantExperiencesEditorEnabled, setIsRelevantExperiencesEditorEnabled] =
    useState<boolean>(() => {
      if (typeof window === 'undefined') return false;
      const saved = window.localStorage.getItem(RELEVANT_EXPERIENCES_EDITOR_STORAGE_KEY);
      return saved === null ? false : saved === 'true';
    });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [introReplayKey, setIntroReplayKey] = useState(0);

  useEffect(() => {
    window.localStorage.setItem(STARFIELD_ENABLED_STORAGE_KEY, String(isStarfieldEnabled));
  }, [isStarfieldEnabled]);

  useEffect(() => {
    window.localStorage.setItem(PERF_LITE_ENABLED_STORAGE_KEY, String(isPerfLiteEnabled));
  }, [isPerfLiteEnabled]);

  useEffect(() => {
    window.localStorage.setItem(
      RELEVANT_EXPERIENCES_EDITOR_STORAGE_KEY,
      String(isRelevantExperiencesEditorEnabled),
    );
  }, [isRelevantExperiencesEditorEnabled]);

  useEffect(() => {
    let isMounted = true;

    void getAdminSession()
      .then(() => {
        if (isMounted) {
          setIsAdminAuthenticated(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAdminAuthenticated(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (pathname === '/admin/login') {
        return;
      }

      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === ADMIN_LOGIN_KEY) {
        event.preventDefault();

        if (isAdminAuthenticated) {
          return;
        }

        const redirectPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.assign(buildAdminLoginUrl(redirectPath));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdminAuthenticated, pathname]);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } finally {
      setIsAdminAuthenticated(false);
      window.location.assign('/');
    }
  };

  if (pathname === '/admin/login') {
    return <AdminLogin />;
  }

  return (
    <>
      <PortfolioExperience
        isStarfieldEnabled={isStarfieldEnabled}
        isPerfLiteEnabled={isPerfLiteEnabled}
        isRelevantExperiencesEditorEnabled={
          isAdminAuthenticated && isRelevantExperiencesEditorEnabled
        }
        replayKey={introReplayKey}
      />
      {isAdminAuthenticated ? (
        <BreakpointDebugOverlay
          isStarfieldEnabled={isStarfieldEnabled}
          onToggleStarfield={() => setIsStarfieldEnabled((prev) => !prev)}
          isPerfLiteEnabled={isPerfLiteEnabled}
          onTogglePerfLite={() => setIsPerfLiteEnabled((prev) => !prev)}
          onReplayIntro={() => setIntroReplayKey((prev) => prev + 1)}
          isRelevantExperiencesEditorEnabled={isRelevantExperiencesEditorEnabled}
          onToggleRelevantExperiencesEditor={() =>
            setIsRelevantExperiencesEditorEnabled((prev) => !prev)
          }
          onLogout={handleLogout}
        />
      ) : null}
    </>
  );
}
