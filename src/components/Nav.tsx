import { useState } from 'react';
import { HowToPlayModal } from './HowToPlayModal';

export function Nav() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <button
              className="brand-name-button"
              onClick={() => setIsModalOpen(true)}
              aria-label="How to play"
            >
              4-σ
            </button>
          </div>
        </div>
      </nav>

      <HowToPlayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
