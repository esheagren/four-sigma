import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAnalytics } from '../../context/PostHogContext';

interface UsernameCheckResult {
  available: boolean;
  suggestions?: string[];
}

interface SignUpPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  onSignIn: () => void;
  checkUsername: (username: string) => Promise<UsernameCheckResult>;
  setUsername: (username: string) => Promise<{ success: boolean; error?: string; suggestions?: string[] }>;
}

export function SignUpPromptModal({
  isOpen,
  onClose,
  onContinueAsGuest,
  onSignIn,
  checkUsername,
  setUsername,
}: SignUpPromptModalProps) {
  const { capture } = useAnalytics();
  const hasTrackedOpen = useRef(false);
  
  // Form state
  const [username, setUsernameValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showGuestWarning, setShowGuestWarning] = useState(false);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  // Track modal open (once per open)
  useEffect(() => {
    if (isOpen && !hasTrackedOpen.current) {
      capture('signup_prompt_shown');
      hasTrackedOpen.current = true;
    } else if (!isOpen) {
      hasTrackedOpen.current = false;
      // Reset form state when modal closes
      setUsernameValue('');
      setUsernameAvailable(null);
      setSuggestions([]);
      setError(null);
      setShowGuestWarning(false);
    }
  }, [isOpen, capture]);

  // Debounced username availability check
  useEffect(() => {
    if (!isOpen) return;
    
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
  }, [username, isOpen, checkUsername]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await setUsername(username);
      if (result.success) {
        capture('signup_prompt_username_claimed');
        onClose();
      } else {
        capture('signup_prompt_username_failed', { error: result.error });
        setError(result.error || 'Failed to claim username');
        if (result.suggestions) {
          setSuggestions(result.suggestions);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueAsGuestClick = () => {
    setShowGuestWarning(true);
  };

  const handleConfirmGuest = () => {
    capture('signup_prompt_continue_as_guest_confirmed');
    onContinueAsGuest();
  };

  const handleBackFromWarning = () => {
    setShowGuestWarning(false);
  };

  const handleSignIn = () => {
    capture('signup_prompt_sign_in_clicked');
    onSignIn();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUsernameValue(suggestion);
    setSuggestions([]);
    setError(null);
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content signup-prompt-modal dark-glass-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {showGuestWarning ? (
          <>
            <div className="modal-header-horizontal">
              <h2 className="modal-title">Continue as Guest?</h2>
              <button
                className="modal-close-button"
                onClick={handleBackFromWarning}
                aria-label="Back"
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="guest-warning-content">
                <div className="guest-warning-icon">⚠️</div>
                <p className="guest-warning-message">
                  Your stats won't be saved and you won't appear on leaderboards.
                </p>
                <p className="guest-warning-submessage">
                  You can always create an account later from the menu.
                </p>
              </div>

              <div className="guest-warning-actions">
                <button
                  className="signup-prompt-primary-button"
                  onClick={handleBackFromWarning}
                >
                  Go Back
                </button>
                <button
                  className="signup-prompt-guest-button"
                  onClick={handleConfirmGuest}
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="modal-header-horizontal">
              <h2 className="modal-title">Create Your Account</h2>
              <button
                className="modal-close-button"
                onClick={handleContinueAsGuestClick}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <p className="signup-prompt-message">
                Pick a username to save your progress and join the leaderboard.
              </p>

              <form onSubmit={handleSubmit} className="signup-prompt-form">
                <div className="form-group">
                  <label htmlFor="signup-username">Username</label>
                  <div className="username-input-wrapper">
                    <input
                      id="signup-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsernameValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="Enter your username"
                      maxLength={20}
                      minLength={3}
                      autoFocus
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

                {error && <div className="auth-error">{error}</div>}

                <button
                  type="submit"
                  className="signup-prompt-primary-button"
                  disabled={isSubmitting || usernameAvailable === false || username.length < 3}
                >
                  {isSubmitting ? 'Claiming...' : 'Claim Username'}
                </button>
              </form>

              <div className="signup-prompt-divider">
                <span>or</span>
              </div>

              <div className="signup-prompt-guest-section">
                <button
                  className="signup-prompt-guest-button"
                  onClick={handleContinueAsGuestClick}
                >
                  Continue as Guest
                </button>
              </div>

              <div className="signup-prompt-signin">
                Already have an account?{' '}
                <button
                  type="button"
                  className="signup-prompt-signin-link"
                  onClick={handleSignIn}
                >
                  Sign in
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
