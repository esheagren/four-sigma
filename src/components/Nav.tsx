import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HowToPlayModal } from './HowToPlayModal';
import { AuthModal } from './AuthModal';
import { useAuth } from '../context/AuthContext';

export function Nav() {
  const { user, isAnonymous, isLoading } = useAuth();
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <Link to="/" className="brand-name-button">
              4-σ
            </Link>
          </div>
          <div className="navbar-actions">
            <button
              className="nav-button how-to-play-button"
              onClick={() => setIsHowToPlayOpen(true)}
              aria-label="How to Play"
            >
              ?
            </button>
            {!isLoading && (
              isAnonymous ? (
                <button
                  className="nav-button sign-in-button"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Sign In
                </button>
              ) : (
                <Link to="/profile" className="nav-button profile-link">
                  {user?.displayName || 'Profile'}
                </Link>
              )
            )}
          </div>
        </div>
      </nav>

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
