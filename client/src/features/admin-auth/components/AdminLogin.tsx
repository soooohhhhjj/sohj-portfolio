import { useEffect, useMemo, useState } from 'react';
import { loginAdmin, getAdminSession } from '../services/adminAuthService';
import './AdminLogin.css';

type SessionState = 'checking' | 'guest' | 'authenticated';

const getRedirectPath = () => {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');

  if (!redirect || !redirect.startsWith('/')) {
    return '/';
  }

  return redirect;
};

export function AdminLogin() {
  const redirectPath = useMemo(() => getRedirectPath(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sessionState, setSessionState] = useState<SessionState>('checking');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void getAdminSession()
      .then(() => {
        if (!isMounted) return;
        setSessionState('authenticated');
        setStatusMessage('You are already signed in. Redirecting back to the portfolio...');
        window.setTimeout(() => {
          window.location.assign(redirectPath);
        }, 700);
      })
      .catch(() => {
        if (!isMounted) return;
        setSessionState('guest');
      });

    return () => {
      isMounted = false;
    };
  }, [redirectPath]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');

    try {
      await loginAdmin(email, password);
      setSessionState('authenticated');
      setStatusMessage('Login successful. Redirecting back to the portfolio...');
      window.setTimeout(() => {
        window.location.assign(redirectPath);
      }, 700);
    } catch (error) {
      setSessionState('guest');
      setStatusMessage(error instanceof Error ? error.message : 'Unable to log in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-shell">
      <div className="admin-login-panel">
        <div className="admin-login-panel__content">
          <p className="admin-login-panel__eyebrow">Admin Access</p>
          <h1 className="admin-login-panel__title font-anta">Login</h1>
          <p className="admin-login-panel__copy">
            This admin access is separate from the public portfolio flow. Once authenticated, we can
            start unlocking admin-only editing controls on the main site.
          </p>

          <form className="admin-login-form" onSubmit={handleSubmit}>
            <label className="admin-login-form__field">
              <span className="admin-login-form__label">Username</span>
              <input
                className="admin-login-form__input"
                type="text"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                disabled={isSubmitting || sessionState === 'checking'}
                required
              />
            </label>

            <label className="admin-login-form__field">
              <span className="admin-login-form__label">Password</span>
              <input
                className="admin-login-form__input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                disabled={isSubmitting || sessionState === 'checking'}
                required
              />
            </label>

            <p
              className={`admin-login-form__message ${
                sessionState === 'authenticated' ? 'admin-login-form__message--success' : ''
              }`}
            >
              {sessionState === 'checking' ? 'Checking existing session...' : statusMessage}
            </p>

            <div className="admin-login-form__actions">
              <a href="/" className="admin-login-form__link">
                Back to portfolio
              </a>

              <button
                type="submit"
                className="admin-login-form__button"
                disabled={isSubmitting || sessionState === 'checking'}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
