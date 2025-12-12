import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { HowToPlayModal } from './HowToPlayModal';
import { AuthModal } from './AuthModal';
import { StatisticsModal } from './StatisticsModal';
import { SettingsModal } from './SettingsModal';
import { FeedbackModal } from './FeedbackModal';
import { AboutModal } from './AboutModal';
import { useAuth } from '../../context/AuthContext';

// Icon components
function HelpCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

const HAS_SEEN_HOW_TO_PLAY_KEY = 'four_sigma_has_seen_how_to_play';

export function Nav() {
  const { isAnonymous, isLoading } = useAuth();
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Show How to Play modal for first-time visitors
  useEffect(() => {
    if (isLoading) return;

    const hasSeenHowToPlay = localStorage.getItem(HAS_SEEN_HOW_TO_PLAY_KEY);
    if (!hasSeenHowToPlay) {
      setIsHowToPlayOpen(true);
      localStorage.setItem(HAS_SEEN_HOW_TO_PLAY_KEY, 'true');
    }
  }, [isLoading]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInMenu = menuRef.current?.contains(target);
      const clickedInDropdown = dropdownRef.current?.contains(target);
      if (!clickedInMenu && !clickedInDropdown) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  const handleMenuItemClick = (openModal: () => void) => {
    setIsMenuOpen(false);
    openModal();
  };

  const getDropdownPosition = () => {
    if (!buttonRef.current) return { top: 0, right: 0 };
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    };
  };

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
            <div className="nav-menu-container" ref={menuRef}>
              <button
                ref={buttonRef}
                className="nav-button nav-icon-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Menu"
                title="Menu"
              >
                <MenuIcon />
              </button>
              {isMenuOpen && createPortal(
                <div
                  ref={dropdownRef}
                  className="nav-dropdown-menu"
                  style={{
                    position: 'fixed',
                    top: getDropdownPosition().top,
                    right: getDropdownPosition().right,
                    zIndex: 99999,
                  }}
                >
                  <button
                    className="nav-dropdown-item"
                    onClick={() => handleMenuItemClick(() => setIsHowToPlayOpen(true))}
                  >
                    <HelpCircleIcon />
                    <span>How to Play</span>
                  </button>
                  <button
                    className="nav-dropdown-item"
                    onClick={() => handleMenuItemClick(() => setIsStatisticsOpen(true))}
                  >
                    <BarChartIcon />
                    <span>Statistics</span>
                  </button>
                  <button
                    className="nav-dropdown-item"
                    onClick={() => handleMenuItemClick(() => setIsFeedbackOpen(true))}
                  >
                    <MessageIcon />
                    <span>Feedback</span>
                  </button>
                  {!isLoading && isAnonymous && (
                    <button
                      className="nav-dropdown-item"
                      onClick={() => handleMenuItemClick(() => setIsAuthModalOpen(true))}
                    >
                      <UserIcon />
                      <span>Sign In</span>
                    </button>
                  )}
                  <button
                    className="nav-dropdown-item"
                    onClick={() => handleMenuItemClick(() => setIsSettingsOpen(true))}
                  >
                    <SettingsIcon />
                    <span>Settings</span>
                  </button>
                  <button
                    className="nav-dropdown-item"
                    onClick={() => handleMenuItemClick(() => setIsAboutOpen(true))}
                  >
                    <InfoIcon />
                    <span>About</span>
                  </button>
                </div>,
                document.body
              )}
            </div>
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

      <StatisticsModal
        isOpen={isStatisticsOpen}
        onClose={() => setIsStatisticsOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </>
  );
}
