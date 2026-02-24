import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';

function App() {
  return <div>SOHJ Portfolio Client</div>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);