import { StrictMode } from 'react';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import { HomePage } from './features/homepage/HomePage';
import { Footer, Navbar } from './shared/layouts';
import { StarfieldBackground } from './shared/components/StarfieldBackground';
import { BreakpointDebugOverlay } from './shared/components/BreakpointDebugOverlay';
import { useScrollVelocity } from './shared/hooks/useScrollVelocity';
import { useResponsiveTokens } from './shared/hooks/useResponsiveTokens';

type StarMode = 'normal' | 'horizontal' | 'vertical' | 'paused' | 'cinematic' | 'forward';

export function App() {
  const [starMode, setStarMode] = useState<StarMode>('normal');
  const [isWelcomeFinished, setIsWelcomeFinished] = useState(false);
  const [isIntroFinished, setIsIntroFinished] = useState(false);
  const showDebugPanels = import.meta.env.DEV;
  useResponsiveTokens();
  useScrollVelocity(isIntroFinished);

  return (
    <div className="app-shell">
      <StarfieldBackground mode={starMode} />
      <Navbar shouldAnimate={isWelcomeFinished} />
      <main className="app-content">
        <HomePage
          setStarMode={setStarMode}
          onWelcomeFinishedChange={setIsWelcomeFinished}
          onIntroFinishedChange={setIsIntroFinished}
        />
      </main>
      <Footer />
      {showDebugPanels ? <BreakpointDebugOverlay /> : null}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
