import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from '../../context/PostHogContext';
import { ModalBackdropAnimation } from '../ModalBackdropAnimation';
import './UsernameClaimModal.css';

interface UsernameClaimModalProps {
  isOpen: boolean;
  onUsernameClaimed: () => void;
}

type CheckStatus = 'idle' | 'checking' | 'valid' | 'taken' | 'invalid';

export function UsernameClaimModal({ isOpen, onUsernameClaimed }: UsernameClaimModalProps) {
  const { claimUsername } = useAuth();
  const { capture } = useAnalytics();
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Check username availability with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!username.trim()) {
      setStatus('idle');
      return;
    }

    if (username.length < 3) {
      setStatus('invalid');
      return;
    }

    setStatus('checking');

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/auth/check-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
        const data = await res.json();

        if (!data.valid) {
          setStatus('invalid');
        } else if (!data.available) {
          setStatus('taken');
        } else {
          setStatus('valid');
        }
      } catch {
        setStatus('idle');
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [username]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow valid characters
    const filtered = value.replace(/[^a-zA-Z0-9_]/g, '');
    setUsername(filtered);
    setError('');
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuggestions([]);

    if (!username.trim() || status !== 'valid') {
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
      setStatus('taken');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUsername(suggestion);
    setSuggestions([]);
    setError('');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <span className="status-icon checking">...</span>;
      case 'valid':
        return <span className="status-icon valid">✓</span>;
      case 'taken':
        return <span className="status-icon taken">✗</span>;
      case 'invalid':
        return <span className="status-icon invalid">✗</span>;
      default:
        return null;
    }
  };

  return createPortal(
    <div className="modal-overlay">
      <ModalBackdropAnimation />
      <div className="username-claim-modal">
        <h2>Choose Username</h2>

        <form onSubmit={handleSubmit}>
          <div className="username-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={username}
              onChange={handleInputChange}
              placeholder="Username"
              maxLength={20}
              disabled={isSubmitting}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {getStatusIcon()}
          </div>

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

          <button
            type="submit"
            className="username-submit"
            disabled={isSubmitting || status !== 'valid'}
          >
            {isSubmitting ? 'Claiming...' : 'Start Playing'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
