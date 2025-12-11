import { useMemo } from 'react';
import { formatNumber } from './gaussianUtils';

interface CrowdData {
  avgMin: number;
  avgMax: number;
  hitRate: number;
}

interface RangeVisualizationProps {
  userMin: number;
  userMax: number;
  trueValue: number;
  hit: boolean;
  score: number;
  unit?: string;
  displayMin?: number;
  displayMax?: number;
  crowdData?: CrowdData;
}

export function RangeVisualization({
  userMin,
  userMax,
  trueValue,
  hit,
  score,
  unit,
  displayMin,
  displayMax,
  crowdData,
}: RangeVisualizationProps) {
  // Calculate display range if not provided
  const range = useMemo(() => {
    if (displayMin !== undefined && displayMax !== undefined) {
      return { min: displayMin, max: displayMax };
    }

    // Auto-calculate range to show all relevant points
    const allValues = [userMin, userMax, trueValue];
    if (crowdData) {
      allValues.push(crowdData.avgMin, crowdData.avgMax);
    }

    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const padding = (maxVal - minVal) * 0.15;

    return {
      min: Math.max(0, minVal - padding),
      max: maxVal + padding,
    };
  }, [userMin, userMax, trueValue, displayMin, displayMax, crowdData]);

  // Convert value to percentage position
  const toPercent = (val: number) => {
    const pct = ((val - range.min) / (range.max - range.min)) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const userStartPct = toPercent(userMin);
  const userEndPct = toPercent(userMax);
  const userWidthPct = userEndPct - userStartPct;
  const correctPct = toPercent(trueValue);

  // Determine if labels would overlap (threshold: 25% of track width)
  const MIN_LABEL_GAP_PCT = 25;
  const labelsOverlap = (userEndPct - userStartPct) < MIN_LABEL_GAP_PCT;

  // Crowd data percentages
  const crowdStartPct = crowdData ? toPercent(crowdData.avgMin) : 0;
  const crowdEndPct = crowdData ? toPercent(crowdData.avgMax) : 0;
  const crowdWidthPct = crowdEndPct - crowdStartPct;

  return (
    <div className="range-viz">
      {/* Header row: Answer on left, Score on right */}
      <div className="range-header-row">
        <div className="range-answer-label">
          {formatNumber(trueValue)}{unit && ` ${unit}`}
        </div>
        <div className={`range-score-badge ${hit ? 'hit' : 'miss'}`}>
          {hit ? '+' : ''}{Math.round(score)} pts
        </div>
      </div>

      {/* Range Track */}
      <div className="range-track-wrapper">
        {/* Track */}
        <div className="range-track">
          {/* Background line */}
          <div className="range-track-bg" />

          {/* User range bar with endpoint dots */}
          <div
            className={`range-bar user ${hit ? 'hit' : 'miss'}`}
            style={{ left: `${userStartPct}%`, width: `${userWidthPct}%` }}
          >
            <div className="range-endpoint left" />
            <div className="range-endpoint right" />
          </div>

          {/* Correct Answer marker dot */}
          <div
            className="range-answer-marker"
            style={{ left: `${correctPct}%` }}
          >
            <div className="range-answer-dot" />
          </div>
        </div>
      </div>

      {/* Bound labels - positioned below endpoints */}
      {labelsOverlap ? (
        /* Collapsed: single centered label when range is narrow */
        <div className="range-bounds-collapsed">
          <div className={`range-bound-label ${hit ? 'hit' : 'miss'}`}>
            {formatNumber(userMin)} – {formatNumber(userMax)}
          </div>
        </div>
      ) : (
        /* Separate: positioned at endpoints with connectors */
        <div className="range-bounds-positioned">
          <div
            className={`range-bound-positioned ${hit ? 'hit' : 'miss'}`}
            style={{ left: `${userStartPct}%` }}
          >
            <div className="range-bound-connector" />
            <div className={`range-bound-label ${hit ? 'hit' : 'miss'}`}>
              {formatNumber(userMin)}
            </div>
          </div>
          <div
            className={`range-bound-positioned ${hit ? 'hit' : 'miss'}`}
            style={{ left: `${userEndPct}%` }}
          >
            <div className="range-bound-connector" />
            <div className={`range-bound-label ${hit ? 'hit' : 'miss'}`}>
              {formatNumber(userMax)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
