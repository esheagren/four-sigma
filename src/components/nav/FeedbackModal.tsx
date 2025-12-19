import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from '../../context/PostHogContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { authToken } = useAuth();
  const { capture } = useAnalytics();
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasTrackedOpen = useRef(false);

  // Track modal open (only once per open)
  useEffect(() => {
    if (isOpen && !hasTrackedOpen.current) {
      capture('feedback_modal_opened');
      hasTrackedOpen.current = true;
    } else if (!isOpen) {
      hasTrackedOpen.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedFeedback = feedbackText.trim();
    if (!trimmedFeedback) {
      setError('Please enter some feedback');
      return;
    }

    if (trimmedFeedback.length > 5000) {
      setError('Feedback must be 5000 characters or less');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          feedbackText: trimmedFeedback,
          pageUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      capture('feedback_submitted', {
        feedbackLength: trimmedFeedback.length,
      });

      setSubmitSuccess(true);
      setFeedbackText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
      capture('feedback_submit_failed', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFeedbackText('');
    setError(null);
    setSubmitSuccess(false);
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content feedback-modal dark-glass-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Squash a Bug</h2>
          <button className="modal-close-button" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {submitSuccess ? (
            <div className="feedback-success">
              <div className="feedback-success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="feedback-success-title">Thanks!</h3>
              <p className="feedback-success-message">Bug report submitted.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="feedback-form">
              <textarea
                className="feedback-textarea"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Describe the issue you encountered."
                rows={8}
                maxLength={5000}
                autoFocus
                disabled={isSubmitting}
              />
              <div className="feedback-char-count">
                {feedbackText.length}/5000
              </div>
              {error && <div className="feedback-error">{error}</div>}
            </form>
          )}
        </div>

        <div className="modal-footer">
          {submitSuccess ? (
            <button className="modal-button" onClick={handleClose}>
              Close
            </button>
          ) : (
            <button
              className="modal-button modal-button-primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !feedbackText.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
