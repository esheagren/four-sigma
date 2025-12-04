import { useMemo } from 'react';
import {
  calculateViewport,
  valueToX,
  formatNumber,
  BASELINE_Y,
  SVG_WIDTH,
} from './gaussianUtils';

interface GaussianLandscapeProps {
  userMin: number;
  userMax: number;
  trueValue: number;
  hit: boolean;
}

export function GaussianLandscape({
  userMin,
  userMax,
  trueValue,
  hit,
}: GaussianLandscapeProps) {
  // Calculate viewport bounds
  const viewport = useMemo(
    () => calculateViewport(userMin, userMax, trueValue),
    [userMin, userMax, trueValue]
  );

  const { viewportMin, viewportRange, isWildMissLeft, isWildMissRight } = viewport;

  // Calculate marker positions
  const userStartX = valueToX(userMin, viewportMin, viewportRange);
  const userEndX = valueToX(userMax, viewportMin, viewportRange);
  const trueValueX = valueToX(trueValue, viewportMin, viewportRange);

  // Convert SVG X coordinates to percentages for label positioning
  const userStartPercent = (userStartX / SVG_WIDTH) * 100;
  const userEndPercent = (userEndX / SVG_WIDTH) * 100;
  const trueValuePercent = (trueValueX / SVG_WIDTH) * 100;

  // Check if true value is visible on screen
  const trueValueVisible = !isWildMissLeft && !isWildMissRight;

  // Color based on hit/miss
  const userColor = hit ? '#10b981' : '#f43f5e';

  return (
    <div className="gaussian-landscape-container">
      <svg
        className="gaussian-landscape"
        viewBox={`0 0 ${SVG_WIDTH} 100`}
        preserveAspectRatio="xMidYMax meet"
      >
        {/* Baseline */}
        <line
          className="baseline"
          x1="0"
          y1={BASELINE_Y}
          x2={SVG_WIDTH}
          y2={BASELINE_Y}
        />

        {/* User interval line */}
        <line
          className={`user-line ${hit ? 'hit' : 'miss'}`}
          x1={userStartX}
          y1={BASELINE_Y}
          x2={userEndX}
          y2={BASELINE_Y}
          stroke={userColor}
        />

        {/* User bound markers (circles) */}
        <circle
          cx={userStartX}
          cy={BASELINE_Y}
          r="4"
          className={`user-marker ${hit ? 'hit' : 'miss'}`}
        />
        <circle
          cx={userEndX}
          cy={BASELINE_Y}
          r="4"
          className={`user-marker ${hit ? 'hit' : 'miss'}`}
        />

        {/* True answer marker (only if visible) */}
        {trueValueVisible && (
          <circle
            cx={trueValueX}
            cy={BASELINE_Y}
            r="5"
            className="answer-marker"
          />
        )}
      </svg>

      {/* Value labels */}
      <div className="value-labels">
        {/* User bound labels (below baseline) */}
        <div
          className={`value-label value-label-user ${hit ? 'hit' : 'miss'}`}
          style={{ left: `${userStartPercent}%` }}
        >
          {formatNumber(userMin)}
        </div>
        <div
          className={`value-label value-label-user ${hit ? 'hit' : 'miss'}`}
          style={{ left: `${userEndPercent}%` }}
        >
          {formatNumber(userMax)}
        </div>

        {/* Answer label (above baseline) */}
        {trueValueVisible && (
          <div
            className="value-label value-label-answer"
            style={{ left: `${trueValuePercent}%` }}
          >
            {formatNumber(trueValue)}
          </div>
        )}
      </div>

      {/* Clamped arrows for off-screen answer */}
      {isWildMissRight && (
        <div className="clamped-arrow clamped-arrow-right">
          <span className="clamped-arrow-value">{formatNumber(trueValue)}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </div>
      )}
      {isWildMissLeft && (
        <div className="clamped-arrow clamped-arrow-left">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          <span className="clamped-arrow-value">{formatNumber(trueValue)}</span>
        </div>
      )}

      {/* Axis labels */}
      <div className="landscape-axis-labels">
        <span className="axis-label axis-label-min">{formatNumber(viewportMin)}</span>
        <span className="axis-label axis-label-max">{formatNumber(viewportMin + viewportRange)}</span>
      </div>
    </div>
  );
}
