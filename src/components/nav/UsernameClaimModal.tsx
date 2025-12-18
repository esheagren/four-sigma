import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from '../../context/PostHogContext';
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

  return (
    <div className="username-claim-modal-overlay">
      <div className="username-claim-modal">
        <h2>Claim Your Username</h2>
        <p className="username-claim-description">
          Choose a username to start playing. You can add email and password later to access your account from any device.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
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
            <div className="error-message">
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

          <button
            type="submit"
            className="username-claim-submit"
            disabled={isSubmitting || !username.trim()}
          >
            {isSubmitting ? 'Claiming...' : 'Claim Username'}
          </button>
        </form>

        <p className="username-claim-note">
          Note: You cannot dismiss this modal without claiming a username
        </p>
      </div>
    </div>
  );
}
