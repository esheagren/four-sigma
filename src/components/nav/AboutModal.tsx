import { createPortal } from 'react-dom';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content about-modal" onClick={(e) => e.stopPropagation()}>
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
            <h3>The Name</h3>
            <p>
              The name "4-σ" (four sigma) comes from statistics, where σ (sigma) represents
              standard deviation—a measure of uncertainty. In a normal distribution, 4 standard
              deviations from the mean captures 99.99% of all values, representing near-certainty.
              The game challenges you to calibrate your own uncertainty estimates.
            </p>
          </div>

          <div className="about-section">
            <h3>Why Play?</h3>
            <p>
              Beyond being a fun daily challenge, 4-σ helps you develop better calibration—the
              ability to accurately assess what you know and don't know. Well-calibrated people
              make better decisions under uncertainty, a valuable skill in many areas of life.
            </p>
          </div>

          <div className="about-section">
            <h3>Created By</h3>
            <p>
              4-σ was created by Erik Sheagren. Questions, feedback, or ideas? Use the Feedback
              option in the menu to get in touch.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
