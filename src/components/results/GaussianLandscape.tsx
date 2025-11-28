import { useMemo } from 'react';
import {
  calculateViewport,
  valueToX,
  generateBezierPath,
  generateClosedBezierPath,
  formatNumber,
  BASELINE_Y,
  SVG_WIDTH,
} from './gaussianUtils';

interface CrowdGuess {
  min: number;
  max: number;
}

interface CrowdData {
  guesses: CrowdGuess[];
  avgMin: number;
  avgMax: number;
  avgHit: boolean;
  hitRate: number;
  totalResponses: number;
}

interface GaussianLandscapeProps {
  userMin: number;
  userMax: number;
  trueValue: number;
  hit: boolean;
  crowdData?: CrowdData;
}

export function GaussianLandscape({
  userMin,
  userMax,
  trueValue,
  hit,
  crowdData,
}: GaussianLandscapeProps) {
  // Calculate viewport bounds
  const viewport = useMemo(
    () => calculateViewport(userMin, userMax, trueValue),
    [userMin, userMax, trueValue]
  );

  const { viewportMin, viewportRange, isWildMissLeft, isWildMissRight } = viewport;

  // Generate crowd curve paths (memoized for performance)
  const crowdPaths = useMemo(() => {
    if (!crowdData?.guesses) return [];

    return crowdData.guesses
      .map((guess, index) => ({
        key: index,
        path: generateBezierPath(guess.min, guess.max, viewportMin, viewportRange),
      }))
      .filter(p => p.path !== '');
  }, [crowdData, viewportMin, viewportRange]);

  // Average player curve
  const avgPath = useMemo(() => {
    if (!crowdData) return '';
    return generateBezierPath(crowdData.avgMin, crowdData.avgMax, viewportMin, viewportRange);
  }, [crowdData, viewportMin, viewportRange]);

  // User curve paths
  const userPath = useMemo(
    () => generateBezierPath(userMin, userMax, viewportMin, viewportRange),
    [userMin, userMax, viewportMin, viewportRange]
  );

  const userFilledPath = useMemo(
    () => generateClosedBezierPath(userMin, userMax, viewportMin, viewportRange),
    [userMin, userMax, viewportMin, viewportRange]
  );

  // Calculate marker positions
  const userStartX = valueToX(userMin, viewportMin, viewportRange);
  const userEndX = valueToX(userMax, viewportMin, viewportRange);
  const trueValueX = valueToX(trueValue, viewportMin, viewportRange);
  const avgStartX = crowdData ? valueToX(crowdData.avgMin, viewportMin, viewportRange) : 0;
  const avgEndX = crowdData ? valueToX(crowdData.avgMax, viewportMin, viewportRange) : 0;

  // Color based on hit/miss
  const userColor = hit ? '#10b981' : '#f43f5e';
  const gradientId = `user-gradient-${Math.random().toString(36).substr(2, 9)}`;

  // Check if true value is visible on screen
  const trueValueVisible = !isWildMissLeft && !isWildMissRight;

  return (
    <div className="gaussian-landscape-container">
      <svg
        className="gaussian-landscape"
        viewBox={`0 0 ${SVG_WIDTH} 100`}
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          {/* Gradient for user curve fill */}
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={userColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={userColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <g className="grid-lines">
          <line x1="25" y1="0" x2="25" y2="100" />
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="75" y1="0" x2="75" y2="100" />
        </g>

        {/* Baseline */}
        <line
          className="baseline"
          x1="0"
          y1={BASELINE_Y}
          x2={SVG_WIDTH}
          y2={BASELINE_Y}
        />

        {/* Layer 1: Crowd wireframe curves */}
        {crowdPaths.length > 0 && (
          <g className="crowd-curves">
            {crowdPaths.map(({ key, path }) => (
              <path key={key} d={path} className="crowd-curve" />
            ))}
          </g>
        )}

        {/* Layer 2: Average player curve */}
        {crowdData && avgPath && (
          <g className="avg-benchmark">
            <path d={avgPath} className="avg-curve" />
            {/* Diamond markers for average bounds */}
            <polygon
              className="avg-marker"
              points={`${avgStartX},${BASELINE_Y - 3} ${avgStartX + 3},${BASELINE_Y} ${avgStartX},${BASELINE_Y + 3} ${avgStartX - 3},${BASELINE_Y}`}
            />
            <polygon
              className="avg-marker"
              points={`${avgEndX},${BASELINE_Y - 3} ${avgEndX + 3},${BASELINE_Y} ${avgEndX},${BASELINE_Y + 3} ${avgEndX - 3},${BASELINE_Y}`}
            />
          </g>
        )}

        {/* Layer 3: User hero curve */}
        <g className="user-curve-group">
          {/* Filled area with gradient */}
          <path d={userFilledPath} fill={`url(#${gradientId})`} />
          {/* Stroke outline */}
          <path
            d={userPath}
            className={`user-curve ${hit ? 'hit' : 'miss'}`}
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
        </g>

        {/* Layer 4: True answer marker (only if visible) */}
        {trueValueVisible && (
          <g className="answer-marker-group">
            <circle
              cx={trueValueX}
              cy={BASELINE_Y}
              r="5"
              className="answer-marker"
            />
          </g>
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
