import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import { StarfieldBackground } from './shared/components/StarfieldBackground';
import { useScrollVelocity } from './shared/hooks/useScrollVelocity';

function App() {
  useScrollVelocity(true);

  return (
    <div className="app-shell">
      <StarfieldBackground />
      <main className="app-content" />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
