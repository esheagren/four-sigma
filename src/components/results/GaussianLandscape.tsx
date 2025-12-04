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

// Label dimensions in SVG coordinate space
const LABEL_WIDTH = 60;
const LABEL_HEIGHT = 24;
const LABEL_GAP = 6;

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

  // Calculate marker positions in SVG coordinates
  const userStartX = valueToX(userMin, viewportMin, viewportRange);
  const userEndX = valueToX(userMax, viewportMin, viewportRange);
  const trueValueX = valueToX(trueValue, viewportMin, viewportRange);

  // Check if true value is visible on screen
  const trueValueVisible = !isWildMissLeft && !isWildMissRight;

  // Calculate overlap - does answer label overlap with either user bound label?
  const answerOverlapsStart = trueValueVisible && Math.abs(trueValueX - userStartX) < LABEL_WIDTH;
  const answerOverlapsEnd = trueValueVisible && Math.abs(trueValueX - userEndX) < LABEL_WIDTH;
  const answerNeedsElevation = answerOverlapsStart || answerOverlapsEnd;

  // Y positions for labels
  const userLabelY = BASELINE_Y + LABEL_GAP;
  const answerLabelY = answerNeedsElevation
    ? BASELINE_Y - LABEL_HEIGHT - LABEL_GAP - 20 // elevated higher
    : BASELINE_Y - LABEL_HEIGHT - LABEL_GAP;

  // Clamp label X positions to stay within SVG bounds
  const clampX = (x: number) => Math.max(LABEL_WIDTH / 2, Math.min(SVG_WIDTH - LABEL_WIDTH / 2, x));

  // Color based on hit/miss
  const userColor = hit ? '#10b981' : '#f43f5e';

  return (
    <div className="gaussian-landscape-container">
      <svg
        className="gaussian-landscape"
        viewBox={`0 0 ${SVG_WIDTH} 130`}
        preserveAspectRatio="xMidYMid meet"
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

        {/* User start label */}
        <foreignObject
          x={clampX(userStartX) - LABEL_WIDTH / 2}
          y={userLabelY}
          width={LABEL_WIDTH}
          height={LABEL_HEIGHT}
        >
          <div className={`svg-label svg-label-user ${hit ? 'hit' : 'miss'}`}>
            {formatNumber(userMin)}
          </div>
        </foreignObject>

        {/* User end label */}
        <foreignObject
          x={clampX(userEndX) - LABEL_WIDTH / 2}
          y={userLabelY}
          width={LABEL_WIDTH}
          height={LABEL_HEIGHT}
        >
          <div className={`svg-label svg-label-user ${hit ? 'hit' : 'miss'}`}>
            {formatNumber(userMax)}
          </div>
        </foreignObject>

        {/* Answer label (only if visible) */}
        {trueValueVisible && (
          <foreignObject
            x={clampX(trueValueX) - LABEL_WIDTH / 2}
            y={answerLabelY}
            width={LABEL_WIDTH}
            height={LABEL_HEIGHT}
          >
            <div className="svg-label svg-label-answer">
              {formatNumber(trueValue)}
            </div>
          </foreignObject>
        )}
      </svg>

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
