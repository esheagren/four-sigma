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
          <LoadingOrb score={totalScore} showScore={true} />
          <div className="score-orb-details">
            <button
              className="score-orb-share-btn"
              onClick={onShare}
              disabled={isSharing}
              aria-label="Share Results"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
          </div>
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
