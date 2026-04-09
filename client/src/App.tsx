import { Welcome } from './features/welcome/components/Welcome';
import { StarfieldBackground } from './shared/components/StarfieldBackground';
import { useScrollVelocity } from './shared/hooks/useScrollVelocity';

export function App() {
  useScrollVelocity(true);

  return (
    <div className="app-shell">
      <StarfieldBackground />
      <main className="app-content">
        <Welcome />
      </main>
    </div>
  );
}
