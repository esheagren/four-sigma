import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HowToPlayModal } from './HowToPlayModal';
import { AuthModal } from './AuthModal';
import { SignUpPromptModal } from './SignUpPromptModal';
import { ClaimAccountModal } from './ClaimAccountModal';
import { UsernameClaimModal } from './UsernameClaimModal';
import { FeedbackModal } from './FeedbackModal';
import { ModeSelector } from './ModeSelector';
import { useAuth } from '../../context/AuthContext';
import { useNumPadMode } from '../../hooks/useNumPadMode';
import { useCalculatorMode } from '../../hooks/useCalculatorMode';

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

function BugIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l1.88 1.88" />
      <path d="M14.12 3.88L16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 116 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 014-4h4a4 4 0 014 4v3c0 3.3-2.7 6-6 6" />
      <path d="M12 20v-9" />
      <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
      <path d="M6 13H2" />
      <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
      <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
      <path d="M22 13h-4" />
      <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
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

function LogOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function PaintbrushIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.37 2.63L14 7l-1.59-1.59a2 2 0 00-2.82 0L8 7l9 9 1.59-1.59a2 2 0 000-2.82L17 10l4.37-4.37a2.12 2.12 0 10-3-3z" />
      <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
      <path d="M14.5 17.5L4.5 15" />
    </svg>
  );
}

// Nav animation themes
const NAV_ANIMATION_THEMES = [
  { id: 'classic', name: 'Classic', description: 'Balanced animations' },
  { id: 'magma', name: 'Magma', description: 'Fiery lava lamp effect' },
] as const;

type NavAnimationTheme = typeof NAV_ANIMATION_THEMES[number]['id'];

const NAV_ANIMATION_THEME_KEY = 'four_sigma_nav_animation_theme';
const HAS_SEEN_HOW_TO_PLAY_KEY = 'four_sigma_has_seen_how_to_play';

export function Nav() {
  const { user, isAnonymous, hasClaimedUsername, isLoading, logout, authToken } = useAuth();
  const { numPadMode, setNumPadMode } = useNumPadMode();
  const { calculatorMode, setCalculatorMode } = useCalculatorMode();
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [howToPlayVariant, setHowToPlayVariant] = useState<'firstTime' | 'returning'>('firstTime');
  const [isUsernameClaimModalOpen, setIsUsernameClaimModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSignUpPromptOpen, setIsSignUpPromptOpen] = useState(false);
  const [isClaimAccountModalOpen, setIsClaimAccountModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'signup'>('login');
  const [navAnimationTheme, setNavAnimationTheme] = useState<NavAnimationTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(NAV_ANIMATION_THEME_KEY);
      if (saved && NAV_ANIMATION_THEMES.some(t => t.id === saved)) {
        return saved as NavAnimationTheme;
      }
    }
    return 'classic';
  });
  const sidebarRef = useRef<HTMLElement>(null);

  // Apply animation theme to document and update status bar color
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', navAnimationTheme);
    localStorage.setItem(NAV_ANIMATION_THEME_KEY, navAnimationTheme);

    // Update theme-color meta tag for iOS status bar
    const themeColorMap: Record<string, string> = { classic: '#22c55e', magma: '#ffc832' };
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColorMap[navAnimationTheme] || '#22c55e');
    }
  }, [navAnimationTheme]);

  // Cycle to next animation theme
  const cycleAnimationTheme = () => {
    const currentIndex = NAV_ANIMATION_THEMES.findIndex(t => t.id === navAnimationTheme);
    const nextIndex = (currentIndex + 1) % NAV_ANIMATION_THEMES.length;
    setNavAnimationTheme(NAV_ANIMATION_THEMES[nextIndex].id);
  };

  const currentThemeInfo = NAV_ANIMATION_THEMES.find(t => t.id === navAnimationTheme);

  // Show How to Play modal for first-time visitors, claim account modal every 3 sessions, or sign-up prompt for returning anonymous users
  useEffect(() => {
    if (isLoading) return;

    const hasSeenHowToPlay = localStorage.getItem(HAS_SEEN_HOW_TO_PLAY_KEY);

    if (!hasSeenHowToPlay) {
      // First visit: show HowToPlay (username claim happens within modal)
      setHowToPlayVariant('firstTime');
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
      setHowToPlayVariant('firstTime');
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

  const handleLogout = async () => {
    await logout();
    setIsExpanded(false);
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
      >
        {/* Header with logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Link to="/" className="brand-link" onClick={() => setIsExpanded(false)}>
              4-σ
            </Link>
          </div>
        </div>

        {/* Menu items */}
        <nav className="sidebar-menu">
          <button
            className="sidebar-item"
            onClick={() => handleMenuItemClick(() => {
              setHowToPlayVariant('returning');
              setIsHowToPlayOpen(true);
            })}
          >
            <HelpCircleIcon />
            <span className="sidebar-item-text">How to Play</span>
          </button>
          <ModeSelector
            numPadMode={numPadMode}
            calculatorMode={calculatorMode}
            onModeChange={(newNumPadMode, newCalcMode) => {
              setNumPadMode(newNumPadMode);
              setCalculatorMode(newCalcMode);
            }}
          />
          <button
            className="sidebar-item"
            onClick={() => handleMenuItemClick(() => setIsFeedbackOpen(true))}
          >
            <BugIcon />
            <span className="sidebar-item-text">Squash a Bug</span>
          </button>
          <button
            className="sidebar-item"
            onClick={cycleAnimationTheme}
            title={currentThemeInfo?.description}
          >
            <PaintbrushIcon />
            <span className="sidebar-item-text">{currentThemeInfo?.name}</span>
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
          {!isLoading && !isAnonymous && user?.email && (
            <button
              className="sidebar-item"
              onClick={handleLogout}
            >
              <LogOutIcon />
              <span className="sidebar-item-text">Log Out</span>
            </button>
          )}
        </nav>

        {/* User info section - visible when expanded */}
        <div className="sidebar-user-section">
          <div className="sidebar-user-info">
            <UserIcon />
            <span className="sidebar-user-name">{user?.displayName || 'Guest'}</span>
          </div>
          {user?.email && (
            <div className="sidebar-user-email">{user.email}</div>
          )}
        </div>
      </aside>

      {/* Floating hamburger button for mobile (visible when sidebar is collapsed) */}
      {!isExpanded && (
        <button
          className="sidebar-toggle-floating"
          onClick={() => setIsExpanded(true)}
          aria-label="Open menu"
        >
          <HamburgerIcon isExpanded={false} />
        </button>
      )}

      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop ${isExpanded ? 'visible' : ''}`}
        onClick={() => setIsExpanded(false)}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={handleHowToPlayClose}
        onGotIt={handleHowToPlayGotIt}
        variant={howToPlayVariant}
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

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
}
