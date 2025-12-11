import { forwardRef } from 'react';
import { LoadingOrb } from '../gameplay/LoadingOrb';

interface ScoreOrbSlideProps {
  totalScore: number;
  onShare: () => void;
  isSharing: boolean;
  scrollProgress?: number;
}

export const ScoreOrbSlide = forwardRef<HTMLDivElement, ScoreOrbSlideProps>(({
  totalScore,
  onShare,
  isSharing,
  scrollProgress = 0,
}, ref) => {
  // Calculate scale: 1.0 at progress=0, 0.35 at progress=1
  const scale = 1 - (scrollProgress * 0.65);
  // Fade out scroll hint as we scroll
  const hintOpacity = 1 - scrollProgress;

  return (
    <div className="tiktok-slide score-orb-slide" ref={ref}>
      {/* Orb container - centered when at full size */}
      <div className="score-orb-centered-container">
        <div
          className="score-orb-content"
          style={{ transform: `scale(${scale})` }}
        >
          <LoadingOrb
            score={totalScore}
            showScore={true}
            onScoreClick={onShare}
            isClickable={!isSharing}
          />
        </div>
      </div>
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
