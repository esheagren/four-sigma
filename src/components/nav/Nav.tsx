import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HowToPlayModal } from './HowToPlayModal';
import { AuthModal } from './AuthModal';
import { SignUpPromptModal } from './SignUpPromptModal';
import { ClaimAccountModal } from './ClaimAccountModal';
import { UsernameClaimModal } from './UsernameClaimModal';
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

function HamburgerIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`hamburger-icon ${isExpanded ? 'expanded' : ''}`}
    >
      <line x1="3" y1="8" x2="21" y2="8" className="hamburger-line hamburger-line-top" />
      <line x1="3" y1="16" x2="21" y2="16" className="hamburger-line hamburger-line-bottom" />
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
  const { user, isAnonymous, hasClaimedUsername, isLoading } = useAuth();
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isUsernameClaimModalOpen, setIsUsernameClaimModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSignUpPromptOpen, setIsSignUpPromptOpen] = useState(false);
  const [isClaimAccountModalOpen, setIsClaimAccountModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'signup'>('login');
  const sidebarRef = useRef<HTMLElement>(null);

  // Show How to Play modal for first-time visitors, claim account modal every 3 sessions, or sign-up prompt for returning anonymous users
  useEffect(() => {
    if (isLoading) return;

    const hasSeenHowToPlay = localStorage.getItem(HAS_SEEN_HOW_TO_PLAY_KEY);

    if (!hasSeenHowToPlay) {
      // First visit: show HowToPlay (username claim happens within modal)
      setIsHowToPlayOpen(true);
      localStorage.setItem(HAS_SEEN_HOW_TO_PLAY_KEY, 'true');
      return;
    }

    // Check if user should see claim account modal
    // Conditions: has claimed username, doesn't have email, and every 3 sessions
    if (
      user &&
      hasClaimedUsername &&
      !user.email &&
      user.sessionCount > 0 &&
      user.sessionCount % 3 === 0
    ) {
      setIsClaimAccountModalOpen(true);
      return;
    }

    // For anonymous returning users who somehow haven't claimed username,
    // show HowToPlayModal again (which includes username claim)
    if (isAnonymous && !hasClaimedUsername) {
      setIsHowToPlayOpen(true);
    }
  }, [isLoading, isAnonymous, user, hasClaimedUsername]);

  // Close sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (sidebarRef.current && !sidebarRef.current.contains(target)) {
        setIsExpanded(false);
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  // Close sidebar on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const handleMenuItemClick = (openModal: () => void) => {
    setIsExpanded(false);
    openModal();
  };

  const handleHowToPlayClose = () => {
    setIsHowToPlayOpen(false);
  };

  // Called when user clicks "Got it" in HowToPlayModal and needs to claim username
  const handleHowToPlayGotIt = () => {
    setIsHowToPlayOpen(false);
    setIsUsernameClaimModalOpen(true);
  };

  const handleUsernameClaimed = () => {
    setIsUsernameClaimModalOpen(false);
  };

  const handleSignUpPromptCreateAccount = () => {
    setIsSignUpPromptOpen(false);
    setAuthModalInitialMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleSignUpPromptContinueAsGuest = () => {
    setIsSignUpPromptOpen(false);
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
      >
        {/* Hamburger toggle button */}
        <button
          className="sidebar-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse menu' : 'Expand menu'}
        >
          <HamburgerIcon isExpanded={isExpanded} />
        </button>

        {/* Logo - visible when expanded */}
        <div className="sidebar-logo">
          <Link to="/" className="brand-link" onClick={() => setIsExpanded(false)}>
            4-σ
          </Link>
        </div>

        {/* Menu items */}
        <nav className="sidebar-menu">
          <button
            className="sidebar-item"
            onClick={() => handleMenuItemClick(() => setIsHowToPlayOpen(true))}
          >
            <HelpCircleIcon />
            <span className="sidebar-item-text">How to Play</span>
          </button>
          <button
            className="sidebar-item"
            onClick={() => handleMenuItemClick(() => setIsStatisticsOpen(true))}
          >
            <BarChartIcon />
            <span className="sidebar-item-text">Statistics</span>
          </button>
          <button
            className="sidebar-item"
            onClick={() => handleMenuItemClick(() => setIsFeedbackOpen(true))}
          >
            <MessageIcon />
            <span className="sidebar-item-text">Feedback</span>
          </button>
          {!isLoading && isAnonymous && (
            <button
              className="sidebar-item"
              onClick={() => handleMenuItemClick(() => {
                setAuthModalInitialMode('login');
                setIsAuthModalOpen(true);
              })}
            >
              <UserIcon />
              <span className="sidebar-item-text">Sign In</span>
            </button>
          )}
          <button
            className="sidebar-item"
            onClick={() => handleMenuItemClick(() => setIsSettingsOpen(true))}
          >
            <SettingsIcon />
            <span className="sidebar-item-text">Settings</span>
          </button>
          <button
            className="sidebar-item"
            onClick={() => handleMenuItemClick(() => setIsAboutOpen(true))}
          >
            <InfoIcon />
            <span className="sidebar-item-text">About</span>
          </button>
        </nav>
      </aside>

      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop ${isExpanded ? 'visible' : ''}`}
        onClick={() => setIsExpanded(false)}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={handleHowToPlayClose}
        onGotIt={handleHowToPlayGotIt}
      />

      <UsernameClaimModal
        isOpen={isUsernameClaimModalOpen}
        onUsernameClaimed={handleUsernameClaimed}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalInitialMode}
      />

      <SignUpPromptModal
        isOpen={isSignUpPromptOpen}
        onClose={handleSignUpPromptContinueAsGuest}
        onCreateAccount={handleSignUpPromptCreateAccount}
        onContinueAsGuest={handleSignUpPromptContinueAsGuest}
      />

      <ClaimAccountModal
        isOpen={isClaimAccountModalOpen}
        onClose={() => setIsClaimAccountModalOpen(false)}
        username={user?.displayName || ''}
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
