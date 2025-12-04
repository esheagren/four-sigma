import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DailyScoreCardProps {
  totalScore: number;
  dailyRank?: number;
  calibration?: number;
  onShare?: () => void;
  isSharing?: boolean;
  hits?: number;
  total?: number;
}

// Animated counter component for total score with easing
function AnimatedTotalScore({ finalScore }: { finalScore: number }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const duration = 1800;
    const startTime = Date.now();

    const easeOutQuint = (t: number): number => {
      return 1 - Math.pow(1 - t, 5);
    };

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuint(progress);
      const currentScore = Math.floor(easedProgress * finalScore);

      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayScore(finalScore);
      }
    };

    requestAnimationFrame(animate);
  }, [finalScore]);

  return <>{displayScore}</>;
}

export function DailyScoreCard({
  totalScore,
  dailyRank,
  calibration,
  onShare,
  isSharing,
  hits = 0,
  total = 3
}: DailyScoreCardProps) {
  const [showCalibrationPopup, setShowCalibrationPopup] = useState(false);

  // Clamp calibration between 0 and 100 for the bar
  const calibrationPercent = calibration !== undefined ? Math.min(100, Math.max(0, calibration)) : 50;

  // Determine share button style based on performance
  const isTopTen = dailyRank !== undefined && dailyRank <= 10;
  const isPerfect = hits === total && total > 0;

  let shareButtonClass = 'score-card-share-btn';
  if (hits === 0) {
    shareButtonClass += ' share-btn-gray';
  } else if (isPerfect && isTopTen) {
    shareButtonClass += ' share-btn-elite';
  } else if (isPerfect) {
    shareButtonClass += ' share-btn-perfect';
  } else {
    shareButtonClass += ' share-btn-default';
  }

  return (
    <div className="score-card-new">
      {/* Calibration Info Popup - rendered via portal to escape backdrop-filter containment */}
      {showCalibrationPopup && createPortal(
        <div className="modal-overlay" onClick={() => setShowCalibrationPopup(false)}>
          <div className="modal-content calibration-popup" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Your Calibration: {calibration !== undefined ? `${calibration.toFixed(0)}%` : '—'}</h2>
            </div>
            <div className="modal-body">
              <p>
                Calibration measures how well your confidence intervals match reality.
                It's the percentage of your 95% confidence intervals that actually contained the correct answer.
              </p>
              <p>
                <strong>Well-calibrated forecasters hit ~95%.</strong> If you make 100 predictions
                with 95% confidence intervals, about 95 should contain the true value.
              </p>
              <p>
                <strong>Below 95%:</strong> You're overconfident (intervals too narrow)
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-button" onClick={() => setShowCalibrationPopup(false)}>
                Got it!
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Total Score Label */}
      <div className="score-card-label">TOTAL SCORE</div>

      {/* Large Score Number */}
      <div className="score-card-value">
        <AnimatedTotalScore finalScore={Math.round(totalScore)} />
      </div>

      {/* Rank Badge */}
      {dailyRank && (
        <div className="score-card-rank">
          <span className="rank-trophy">🏆</span>
          <span>Rank #{dailyRank}</span>
        </div>
      )}

      {/* Calibration Section */}
      <div className="score-card-calibration">
        <button
          className="calibration-bar-track"
          onClick={() => setShowCalibrationPopup(true)}
          aria-label="View calibration details"
        >
          <div className="calibration-bar-fill" />
          <div
            className="calibration-bar-marker"
            style={{ left: `${calibrationPercent}%` }}
          />
        </button>
      </div>

      {/* Share Button */}
      {onShare && (
        <button
          className={shareButtonClass}
          onClick={onShare}
          disabled={isSharing}
          aria-label="Share score"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
        </button>
      )}
    </div>
  );
}
