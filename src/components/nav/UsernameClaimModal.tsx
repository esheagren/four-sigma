import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from '../../context/PostHogContext';
import { ModalBackdropAnimation } from '../ModalBackdropAnimation';
import './UsernameClaimModal.css';

interface UsernameClaimModalProps {
  isOpen: boolean;
  onUsernameClaimed: () => void;
}

export function UsernameClaimModal({ isOpen, onUsernameClaimed }: UsernameClaimModalProps) {
  const { claimUsername } = useAuth();
  const { capture } = useAnalytics();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuggestions([]);

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setIsSubmitting(true);

    const result = await claimUsername(username);

    setIsSubmitting(false);

    if (result.success) {
      capture('username_claimed', { usernameLength: username.length });
      onUsernameClaimed();
    } else {
      capture('username_claim_failed', { reason: result.error });
      setError(result.error || 'Failed to claim username');
      if (result.suggestions) {
        setSuggestions(result.suggestions);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUsername(suggestion);
    setSuggestions([]);
    setError('');
  };

  return createPortal(
    <div className="modal-overlay">
      <ModalBackdropAnimation />
      <div className="modal-content dark-glass-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Claim Your Username</h2>
        </div>

        <div className="modal-body username-claim-body">
          <p className="username-claim-description">
            Choose a username to start playing. You can add email and password later to access your account from any device.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="username-form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]{3,20}"
                title="Username must be 3-20 characters (letters, numbers, underscores only)"
                disabled={isSubmitting}
                autoFocus
              />
              <small className="input-hint">
                3-20 characters (letters, numbers, underscores only)
              </small>
            </div>

            {error && (
              <div className="username-error-message">
                {error}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="suggestions">
                <p className="suggestions-label">Try these instead:</p>
                <div className="suggestions-list">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="suggestion-button"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-footer-actions">
              <button
                type="submit"
                className="got-it-button"
                disabled={isSubmitting || !username.trim()}
              >
                {isSubmitting ? 'Claiming...' : 'Start Playing'}
              </button>
            </div>
          </form>

          <p className="username-claim-note">
            You must claim a username to play
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
