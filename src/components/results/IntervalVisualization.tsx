import { useMemo } from 'react';
import { calculateViewport, formatNumber } from './gaussianUtils';

interface IntervalVisualizationProps {
  userMin: number;
  userMax: number;
  trueValue: number;
  hit: boolean;
}

// Threshold for label collision detection (percentage)
const COLLISION_THRESHOLD = 12;

export function IntervalVisualization({
  userMin,
  userMax,
  trueValue,
  hit,
}: IntervalVisualizationProps) {
  // Calculate viewport bounds
  const viewport = useMemo(
    () => calculateViewport(userMin, userMax, trueValue),
    [userMin, userMax, trueValue]
  );

  const { viewportMin, viewportRange, isWildMissLeft, isWildMissRight } = viewport;

  // Convert value to percentage position
  const toPercent = (val: number) =>
    ((val - viewportMin) / viewportRange) * 100;

  const userStartPct = toPercent(userMin);
  const userEndPct = toPercent(userMax);
  const answerPct = toPercent(trueValue);

  // Check if answer is visible
  const answerVisible = !isWildMissLeft && !isWildMissRight;

  // Detect if answer label needs elevation (collides with user labels)
  const needsElevation = useMemo(() => {
    if (!answerVisible) return false;
    const collidesWithStart = Math.abs(answerPct - userStartPct) < COLLISION_THRESHOLD;
    const collidesWithEnd = Math.abs(answerPct - userEndPct) < COLLISION_THRESHOLD;
    return collidesWithStart || collidesWithEnd;
  }, [answerVisible, answerPct, userStartPct, userEndPct]);

  return (
    <div className="interval-viz">
      {/* Answer label - positioned above track when elevated */}
      {answerVisible && needsElevation && (
        <div className="interval-answer-elevated">
          <div
            className="interval-label answer"
            style={{ left: `${answerPct}%` }}
          >
            {formatNumber(trueValue)}
          </div>
          <div
            className="interval-connector"
            style={{ left: `${answerPct}%` }}
          />
        </div>
      )}

      {/* Track with markers */}
      <div className="interval-track">
        <div className="interval-baseline" />

        {/* User range bar */}
        <div
          className={`interval-user-range ${hit ? 'hit' : 'miss'}`}
          style={{
            left: `${userStartPct}%`,
            width: `${userEndPct - userStartPct}%`,
          }}
        />

        {/* User bound markers */}
        <div
          className={`interval-marker user ${hit ? 'hit' : 'miss'}`}
          style={{ left: `${userStartPct}%` }}
        />
        <div
          className={`interval-marker user ${hit ? 'hit' : 'miss'}`}
          style={{ left: `${userEndPct}%` }}
        />

        {/* Answer marker */}
        {answerVisible && (
          <div
            className="interval-marker answer"
            style={{ left: `${answerPct}%` }}
          />
        )}
      </div>

      {/* Labels below track */}
      <div className="interval-labels">
        {/* User start label */}
        <div
          className={`interval-label user ${hit ? 'hit' : 'miss'}`}
          style={{ left: `${userStartPct}%` }}
        >
          {formatNumber(userMin)}
        </div>

        {/* User end label */}
        <div
          className={`interval-label user ${hit ? 'hit' : 'miss'}`}
          style={{ left: `${userEndPct}%` }}
        >
          {formatNumber(userMax)}
        </div>

        {/* Answer label - only here if not elevated */}
        {answerVisible && !needsElevation && (
          <div
            className="interval-label answer"
            style={{ left: `${answerPct}%` }}
          >
            {formatNumber(trueValue)}
          </div>
        )}
      </div>

      {/* Off-screen indicators */}
      {isWildMissRight && (
        <div className="interval-offscreen right">
          {formatNumber(trueValue)} →
        </div>
      )}
      {isWildMissLeft && (
        <div className="interval-offscreen left">
          ← {formatNumber(trueValue)}
        </div>
      )}

      {/* Axis labels */}
      <div className="interval-axis">
        <span>{formatNumber(viewportMin)}</span>
        <span>{formatNumber(viewportMin + viewportRange)}</span>
      </div>
    </div>
  );
}
