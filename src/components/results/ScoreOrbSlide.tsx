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
  // Calculate vertical position: centered (50%) → near top (10%) as scroll progresses
  const topPosition = 50 - (scrollProgress * 40);
  // Fade out scroll hint as we scroll
  const hintOpacity = 1 - scrollProgress;

  return (
    <div className="tiktok-slide score-orb-slide" ref={ref}>
      {/* Fixed orb that moves from center to top as user scrolls */}
      <div
        className="score-orb-fixed"
        style={{
          top: `${topPosition}%`,
          transform: `translateX(-50%) translateY(-50%) scale(${scale})`,
        }}
      >
        <LoadingOrb
          score={totalScore}
          showScore={true}
          onScoreClick={onShare}
          isClickable={!isSharing}
        />
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
