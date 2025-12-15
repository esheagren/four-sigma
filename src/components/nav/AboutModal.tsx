import { createPortal } from 'react-dom';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content about-modal dark-glass-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">About 4-σ</h2>
          <button className="modal-close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="about-section">
            <h3>What is 4-σ?</h3>
            <p>
              4-σ (Four Sigma) is a daily quantitative estimation game that challenges you to estimate
              numerical quantities while expressing your uncertainty. Each day, you'll face 3 new
              questions spanning diverse topics from science and history to geography and economics.
            </p>
          </div>

          <div className="about-section">
            <h3>Created By</h3>
            <p>
              4-σ was created by <a href="https://eriksheagren.notion.site" target="_blank" rel="noopener noreferrer">Erik Sheagren</a>.
              Questions, feedback, or ideas? Use the Feedback option in the menu to get in touch,
              or check out the project on{' '}
              <a href="https://github.com/esheagren/four-sigma" target="_blank" rel="noopener noreferrer">GitHub</a>.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
