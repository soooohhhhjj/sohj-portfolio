import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import { BreakpointDebugOverlay } from './shared/components/BreakpointDebugOverlay';
import { Section, SectionContent } from './shared/components/Container';
import { StarfieldBackground } from './shared/components/StarfieldBackground';
import { useScrollVelocity } from './shared/hooks/useScrollVelocity';

export function App() {
  useScrollVelocity();

  return (
    <div className="app-shell">
      <StarfieldBackground />
      <BreakpointDebugOverlay />
      <main className="app-content">
        {Array.from({ length: 5 }, (_, index) => (
          <Section key={`debug-panel-${index}`}>
            <SectionContent>
              <div className={`debug-vh-block debug-breakpoint-guide debug-vh-block--${index + 1}`} />
            </SectionContent>
          </Section>
        ))}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
