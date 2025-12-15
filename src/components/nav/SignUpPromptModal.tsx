import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAnalytics } from '../../context/PostHogContext';

interface SignUpPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount: () => void;
  onContinueAsGuest: () => void;
}

export function SignUpPromptModal({
  isOpen,
  onClose,
  onCreateAccount,
  onContinueAsGuest,
}: SignUpPromptModalProps) {
  const { capture } = useAnalytics();
  const hasTrackedOpen = useRef(false);

  // Track modal open (once per open)
  useEffect(() => {
    if (isOpen && !hasTrackedOpen.current) {
      capture('signup_prompt_shown');
      hasTrackedOpen.current = true;
    } else if (!isOpen) {
      hasTrackedOpen.current = false;
    }
  }, [isOpen, capture]);

  if (!isOpen) return null;

  const handleCreateAccount = () => {
    capture('signup_prompt_create_account_clicked');
    onCreateAccount();
  };

  const handleContinueAsGuest = () => {
    capture('signup_prompt_continue_as_guest_clicked');
    onContinueAsGuest();
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content signup-prompt-modal dark-glass-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-horizontal">
          <h2 className="modal-title">Create Your Account</h2>
          <button
            className="modal-close-button"
            onClick={handleContinueAsGuest}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          <p className="signup-prompt-subtitle">
            Get more out of 4-σ by creating a free account:
          </p>

          <ul className="signup-prompt-benefits">
            <li>
              <span className="benefit-icon">📊</span>
              <span><strong>Track your stats</strong> – See your progress over time</span>
            </li>
            <li>
              <span className="benefit-icon">🏆</span>
              <span><strong>Join the leaderboard</strong> – Compete with other players</span>
            </li>
            <li>
              <span className="benefit-icon">🔄</span>
              <span><strong>Sync across devices</strong> – Play anywhere, anytime</span>
            </li>
          </ul>

          <div className="signup-prompt-actions">
            <button
              className="signup-prompt-primary-button"
              onClick={handleCreateAccount}
            >
              Create Account
            </button>
            <button
              className="signup-prompt-secondary-button"
              onClick={handleContinueAsGuest}
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
