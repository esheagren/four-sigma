import { forwardRef } from 'react';
import { LoadingOrb } from '../gameplay/LoadingOrb';

interface ScoreOrbSlideProps {
  totalScore: number;
  onShare: () => void;
  isSharing: boolean;
}

export const ScoreOrbSlide = forwardRef<HTMLDivElement, ScoreOrbSlideProps>(({
  totalScore,
  onShare,
  isSharing,
}, ref) => {
  return (
    <div className="tiktok-slide score-orb-slide" ref={ref}>
      <div className="slide-body">
        <div className="score-orb-content">
          <LoadingOrb
            score={totalScore}
            showScore={true}
            onScoreClick={onShare}
            isClickable={!isSharing}
          />
        </div>
        {/* Scroll hint */}
        <div className="slide-scroll-hint">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
});

ScoreOrbSlide.displayName = 'ScoreOrbSlide';
