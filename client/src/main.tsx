import { StrictMode } from 'react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import { HomePage } from './features/homepage/HomePage';
import { Footer } from './shared/layouts';
import { StarfieldBackground } from './shared/components/StarfieldBackground';
import { BreakpointDebugOverlay } from './shared/components/BreakpointDebugOverlay';
import { useScrollVelocity } from './shared/hooks/useScrollVelocity';
import { useResponsiveTokens } from './shared/hooks/useResponsiveTokens';

type StarMode = 'normal' | 'horizontal' | 'vertical' | 'paused' | 'cinematic' | 'forward';
const STARFIELD_ENABLED_STORAGE_KEY = 'sohj.debug.starfield.enabled';
const PERF_LITE_ENABLED_STORAGE_KEY = 'sohj.debug.perfLite.enabled';

export function App() {
  const [starMode, setStarMode] = useState<StarMode>('normal');
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
  const [isIntroFinished, setIsIntroFinished] = useState(false);
  const [introReplayKey, setIntroReplayKey] = useState(0);
  const showDebugPanels = import.meta.env.DEV;
  useResponsiveTokens();
  useScrollVelocity(isIntroFinished);

  useEffect(() => {
    window.localStorage.setItem(STARFIELD_ENABLED_STORAGE_KEY, String(isStarfieldEnabled));
  }, [isStarfieldEnabled]);

  useEffect(() => {
    window.localStorage.setItem(PERF_LITE_ENABLED_STORAGE_KEY, String(isPerfLiteEnabled));
  }, [isPerfLiteEnabled]);

  const replayIntro = () => {
    setIsIntroFinished(false);
    setIntroReplayKey((prev) => prev + 1);
  };

  return (
    <div className={`app-shell ${isPerfLiteEnabled ? 'perf-debug-lite' : ''}`}>
      {isStarfieldEnabled ? <StarfieldBackground mode={starMode} /> : null}
      <main className="app-content">
        <HomePage
          key={introReplayKey}
          setStarMode={setStarMode}
          onIntroFinishedChange={setIsIntroFinished}
        />
      </main>
      <Footer />
      {showDebugPanels ? (
        <BreakpointDebugOverlay
          isStarfieldEnabled={isStarfieldEnabled}
          onToggleStarfield={() => setIsStarfieldEnabled((prev) => !prev)}
          isPerfLiteEnabled={isPerfLiteEnabled}
          onTogglePerfLite={() => setIsPerfLiteEnabled((prev) => !prev)}
          onReplayIntro={replayIntro}
        />
      ) : null}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
