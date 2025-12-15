import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from '../../context/PostHogContext';

interface EmailUpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmail: () => void;
  onMaybeLater: () => void;
}

export function EmailUpgradePromptModal({
  isOpen,
  onClose,
  onAddEmail,
  onMaybeLater,
}: EmailUpgradePromptModalProps) {
  const { user, linkEmail } = useAuth();
  const { capture } = useAnalytics();
  const hasTrackedOpen = useRef(false);
  
  // Form state for inline email linking
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Track modal open (once per open)
  useEffect(() => {
    if (isOpen && !hasTrackedOpen.current) {
      capture('email_upgrade_prompt_shown', { username: user?.username });
      hasTrackedOpen.current = true;
    } else if (!isOpen) {
      hasTrackedOpen.current = false;
      // Reset form state when modal closes
      setEmail('');
      setPassword('');
      setError(null);
      setShowForm(false);
    }
  }, [isOpen, capture, user?.username]);

  if (!isOpen) return null;

  const handleAddEmailClick = () => {
    capture('email_upgrade_prompt_add_clicked');
    setShowForm(true);
  };

  const handleMaybeLater = () => {
    capture('email_upgrade_prompt_later_clicked');
    onMaybeLater();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await linkEmail(email, password);
      if (result.success) {
        capture('email_upgrade_completed');
        onClose();
      } else {
        capture('email_upgrade_failed', { error: result.error });
        setError(result.error || 'Failed to add email');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content email-upgrade-modal dark-glass-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-horizontal">
          <h2 className="modal-title">Secure Your Account</h2>
          <button
            className="modal-close-button"
            onClick={handleMaybeLater}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {!showForm ? (
            <>
              <p className="email-upgrade-message">
                Hey <strong>{user?.username}</strong>! Add an email to your account so you can recover it if you ever lose access to this device.
              </p>
              <p className="email-upgrade-submessage">
                Your stats and leaderboard position will be safe.
              </p>

              <div className="email-upgrade-actions">
                <button
                  className="email-upgrade-primary-button"
                  onClick={handleAddEmailClick}
                >
                  Add Email
                </button>
                <button
                  className="email-upgrade-secondary-button"
                  onClick={handleMaybeLater}
                >
                  Maybe Later
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="email-upgrade-form">
              <p className="email-upgrade-form-intro">
                Link an email and password to <strong>{user?.username}</strong>
              </p>
              
              <div className="form-group">
                <label htmlFor="upgrade-email">Email</label>
                <input
                  id="upgrade-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="upgrade-password">Password</label>
                <input
                  id="upgrade-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  minLength={6}
                  required
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <div className="email-upgrade-form-actions">
                <button
                  type="submit"
                  className="email-upgrade-primary-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Email'}
                </button>
                <button
                  type="button"
                  className="email-upgrade-secondary-button"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

