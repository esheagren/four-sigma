import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from '../../context/PostHogContext';
import './ClaimAccountModal.css';

interface ClaimAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export function ClaimAccountModal({ isOpen, onClose, username }: ClaimAccountModalProps) {
  const { claimAccount, user } = useAuth();
  const { capture } = useAnalytics();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    const result = await claimAccount(email, password);

    setIsSubmitting(false);

    if (result.success) {
      capture('account_claimed', { sessionCount: user?.sessionCount });
      onClose();
    } else {
      capture('account_claim_failed', { reason: result.error });
      setError(result.error || 'Failed to claim account');
    }
  };

  const handleRemindLater = () => {
    capture('account_claim_dismissed', { sessionCount: user?.sessionCount });
    onClose();
  };

  return (
    <div className="claim-account-modal-overlay">
      <div className="claim-account-modal">
        <button
          className="modal-close-button"
          onClick={handleRemindLater}
          aria-label="Close"
        >
          &times;
        </button>

        <h2>Claim Your Account</h2>
        <p className="claim-account-description">
          Save your progress and access your account from any device!
        </p>

        <div className="current-username">
          <span className="username-label">Your username:</span>
          <span className="username-value">{username}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="button-group">
            <button
              type="submit"
              className="claim-account-submit"
              disabled={isSubmitting || !email.trim() || !password.trim()}
            >
              {isSubmitting ? 'Claiming...' : 'Claim Account'}
            </button>

            <button
              type="button"
              className="claim-account-later"
              onClick={handleRemindLater}
              disabled={isSubmitting}
            >
              Remind Me in 3 Games
            </button>
          </div>
        </form>

        <p className="claim-account-benefits">
          <strong>Benefits:</strong> Access your account from any device, save your progress, and never lose your stats!
        </p>
      </div>
    </div>
  );
}
