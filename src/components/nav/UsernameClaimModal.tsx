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
    <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
      <ModalBackdropAnimation />
      <div className="username-claim-modal">
        <h2>Choose Username</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            maxLength={20}
            disabled={isSubmitting}
            autoFocus
          />

          {error && <div className="username-error">{error}</div>}

          {suggestions.length > 0 && (
            <div className="username-suggestions">
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => handleSuggestionClick(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <button type="submit" className="username-submit" disabled={isSubmitting || !username.trim()}>
            {isSubmitting ? 'Claiming...' : 'Start Playing'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
