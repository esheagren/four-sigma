import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from '../../context/PostHogContext';

type AuthMode = 'login' | 'signup-username' | 'signup-full';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'signup' }: AuthModalProps) {
  const { login, signup, setUsername, checkUsername } = useAuth();
  const { capture } = useAnalytics();
  const [mode, setMode] = useState<AuthMode>(initialMode === 'login' ? 'login' : 'signup-username');
  const [username, setUsernameValue] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const hasTrackedOpen = useRef(false);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync mode with initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode === 'login' ? 'login' : 'signup-username');
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

  // Debounced username availability check
  useEffect(() => {
    if (mode !== 'signup-username' && mode !== 'signup-full') return;
    
    // Clear previous timeout
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    // Reset state if username is empty or too short
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setSuggestions([]);
      return;
    }

    // Debounce the check
    setIsCheckingUsername(true);
    usernameCheckTimeout.current = setTimeout(async () => {
      const result = await checkUsername(username);
      setUsernameAvailable(result.available);
      setSuggestions(result.suggestions || []);
      setIsCheckingUsername(false);
    }, 400);

    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, [username, mode, checkUsername]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const result = await login(email, password);
        if (result.success) {
          capture('auth_login_completed');
          handleClose();
        } else {
          capture('auth_login_failed', { error: result.error });
          setError(result.error || 'Login failed');
        }
      } else if (mode === 'signup-username') {
        // Username-only signup
        if (!username.trim() || username.length < 3) {
          setError('Username must be at least 3 characters');
          setIsSubmitting(false);
          return;
        }
        const result = await setUsername(username);
        if (result.success) {
          capture('auth_signup_completed', { method: 'username_only' });
          handleClose();
        } else {
          capture('auth_signup_failed', { error: result.error, method: 'username_only' });
          setError(result.error || 'Failed to set username');
          if (result.suggestions) {
            setSuggestions(result.suggestions);
          }
        }
      } else if (mode === 'signup-full') {
        // Full email signup
        if (!username.trim() || username.length < 3) {
          setError('Username must be at least 3 characters');
          setIsSubmitting(false);
          return;
        }
        const result = await signup(email, password, username);
        if (result.success) {
          capture('auth_signup_completed', { method: 'email' });
          handleClose();
        } else {
          capture('auth_signup_failed', { error: result.error, method: 'email' });
          setError(result.error || 'Signup failed');
          if (result.suggestions) {
            setSuggestions(result.suggestions);
          }
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
    setUsernameValue('');
    setError(null);
    setSuggestions([]);
    setUsernameAvailable(null);
    setMode('signup-username');
    onClose();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUsernameValue(suggestion);
    setSuggestions([]);
    setError(null);
  };

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Sign In';
      case 'signup-username':
        return 'Choose a Username';
      case 'signup-full':
        return 'Create Full Account';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signup-username':
        return 'Pick a unique username to save your progress. You can add email later for account recovery.';
      case 'signup-full':
        return 'Create an account with email for full account recovery.';
      default:
        return null;
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content auth-modal dark-glass-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{getTitle()}</h2>
          <button className="modal-close-button" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {getSubtitle() && (
            <p className="auth-modal-subtitle">{getSubtitle()}</p>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Username field - shown for signup modes */}
            {(mode === 'signup-username' || mode === 'signup-full') && (
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="username-input-wrapper">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsernameValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="Enter your username"
                    maxLength={20}
                    minLength={3}
                    required
                    autoFocus={mode === 'signup-username'}
                    className={
                      usernameAvailable === true ? 'input-valid' :
                      usernameAvailable === false ? 'input-invalid' : ''
                    }
                  />
                  {isCheckingUsername && (
                    <span className="username-status checking">checking...</span>
                  )}
                  {!isCheckingUsername && usernameAvailable === true && username.length >= 3 && (
                    <span className="username-status available">✓ available</span>
                  )}
                  {!isCheckingUsername && usernameAvailable === false && (
                    <span className="username-status taken">✗ taken</span>
                  )}
                </div>
                <small className="form-hint">3-20 characters, letters, numbers, and underscores only</small>
                
                {/* Username suggestions */}
                {suggestions.length > 0 && (
                  <div className="username-suggestions">
                    <span className="suggestions-label">Try:</span>
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="suggestion-chip"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Email field - shown for login and full signup */}
            {(mode === 'login' || mode === 'signup-full') && (
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoFocus={mode === 'login'}
                />
              </div>
            )}

            {/* Password field - shown for login and full signup */}
            {(mode === 'login' || mode === 'signup-full') && (
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
            )}

            {error && <div className="auth-error">{error}</div>}

            <button
              type="submit"
              className="auth-submit-button"
              disabled={isSubmitting || (mode !== 'login' && usernameAvailable === false)}
            >
              {isSubmitting
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign In'
                : mode === 'signup-username'
                ? 'Claim Username'
                : 'Create Account'}
            </button>
          </form>

          {/* Mode toggles */}
          <div className="auth-toggle">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup-username');
                    setError(null);
                    capture('auth_mode_toggled', { newMode: 'signup-username' });
                  }}
                  className="auth-toggle-button"
                >
                  Sign up
                </button>
              </p>
            ) : mode === 'signup-username' ? (
              <>
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      capture('auth_mode_toggled', { newMode: 'login' });
                    }}
                    className="auth-toggle-button"
                  >
                    Sign in
                  </button>
                </p>
                <p className="auth-toggle-secondary">
                  Want email recovery?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup-full');
                      setError(null);
                      capture('auth_mode_toggled', { newMode: 'signup-full' });
                    }}
                    className="auth-toggle-button"
                  >
                    Full account
                  </button>
                </p>
              </>
            ) : (
              <>
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      capture('auth_mode_toggled', { newMode: 'login' });
                    }}
                    className="auth-toggle-button"
                  >
                    Sign in
                  </button>
                </p>
                <p className="auth-toggle-secondary">
                  Just want a username?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup-username');
                      setError(null);
                      capture('auth_mode_toggled', { newMode: 'signup-username' });
                    }}
                    className="auth-toggle-button"
                  >
                    Quick signup
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
