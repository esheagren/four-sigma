import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from '../../context/PostHogContext';

type AuthMode = 'login' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { login, signup } = useAuth();
  const { capture } = useAnalytics();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedOpen = useRef(false);

  // Sync mode with initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Track modal open (only once per open)
  useEffect(() => {
    if (isOpen && !hasTrackedOpen.current) {
      capture('auth_modal_opened', { initialMode: mode });
      hasTrackedOpen.current = true;
    } else if (!isOpen) {
      hasTrackedOpen.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let result;
      if (mode === 'login') {
        result = await login(email, password);
        if (result.success) {
          capture('auth_login_completed');
          handleClose();
        } else {
          capture('auth_login_failed', { error: result.error });
          setError(result.error || 'Login failed');
        }
      } else {
        if (!displayName.trim()) {
          setError('Display name is required');
          setIsSubmitting(false);
          return;
        }
        result = await signup(email, password, displayName);
        if (result.success) {
          capture('auth_signup_completed', {
            method: 'email',
            displayNameLength: displayName.length,
          });
          handleClose();
        } else {
          capture('auth_signup_failed', { error: result.error });
          setError(result.error || 'Signup failed');
        }
      }
    } catch (err) {
      capture('auth_error', { mode, error: 'unexpected_exception' });
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError(null);
    setMode('login');
    onClose();
  };

  const toggleMode = () => {
    const newMode = mode === 'login' ? 'signup' : 'login';
    setMode(newMode);
    setError(null);
    capture('auth_mode_toggled', { newMode });
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
          <button className="modal-close-button" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
        {mode === 'signup' && (
          <p className="auth-modal-subtitle">
            Create an account to save your progress and play on any device.
          </p>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                maxLength={50}
                required={mode === 'signup'}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              minLength={6}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button type="button" onClick={toggleMode} className="auth-toggle-button">
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button type="button" onClick={toggleMode} className="auth-toggle-button">
                Sign in
              </button>
            </p>
          )}
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
