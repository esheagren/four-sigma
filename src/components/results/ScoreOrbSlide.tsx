import { forwardRef } from 'react';

interface ScoreOrbSlideProps {
  scrollProgress?: number;
}

/**
 * ScoreOrbSlide is now just a spacer slide that reserves vertical space
 * for scroll-snap. The actual orb is rendered by Game.tsx and positioned
 * based on scroll progress passed up via callback.
 */
export const ScoreOrbSlide = forwardRef<HTMLDivElement, ScoreOrbSlideProps>(({
  scrollProgress = 0,
}, ref) => {
  // Fade out scroll hint as we scroll
  const hintOpacity = 1 - scrollProgress;

  return (
    <div className="tiktok-slide score-orb-slide" ref={ref}>
      {/* Scroll hint - fades as user scrolls */}
      <div className="slide-scroll-hint" style={{ opacity: hintOpacity }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
});

ScoreOrbSlide.displayName = 'ScoreOrbSlide';
