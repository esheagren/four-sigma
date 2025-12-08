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
  displayMin?: number;
  displayMax?: number;
  crowdData?: CrowdData;
}

export function RangeVisualization({
  userMin,
  userMax,
  trueValue,
  hit,
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

  // Crowd data percentages
  const crowdStartPct = crowdData ? toPercent(crowdData.avgMin) : 0;
  const crowdEndPct = crowdData ? toPercent(crowdData.avgMax) : 0;
  const crowdWidthPct = crowdEndPct - crowdStartPct;

  return (
    <div className="range-viz">
      {/* User Range Section */}
      <div className="range-section">
        <div className="range-header">
          <span className="range-label">YOUR RANGE</span>
          <span className="range-values">
            {formatNumber(userMin)} — {formatNumber(userMax)}
          </span>
        </div>
        <div className="range-track-container">
          <div className="range-track">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(pos => (
              <div key={pos} className="range-gridline" style={{ left: `${pos}%` }} />
            ))}
            {/* User range bar */}
            <div
              className={`range-bar user ${hit ? 'hit' : 'miss'}`}
              style={{ left: `${userStartPct}%`, width: `${userWidthPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Crowd Heatmap Section (if data available) */}
      {crowdData && (
        <div className="range-section crowd">
          <div className="range-header">
            <span className="range-label">OTHERS</span>
            <span className="range-hint">{Math.round(crowdData.hitRate * 100)}% hit rate</span>
          </div>
          <div className="range-track-container crowd">
            <div className="range-track">
              {[0, 25, 50, 75, 100].map(pos => (
                <div key={pos} className="range-gridline faint" style={{ left: `${pos}%` }} />
              ))}
              {/* Crowd gradient bar */}
              <div
                className="range-bar crowd"
                style={{
                  left: `${crowdStartPct}%`,
                  width: `${crowdWidthPct}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Correct Answer Line */}
      <div
        className={`range-answer-line ${hit ? 'hit' : ''}`}
        style={{ left: `${correctPct}%` }}
      >
        <div className={`range-answer-badge ${hit ? 'hit' : ''}`}>
          {formatNumber(trueValue)}
        </div>
      </div>

      {/* Axis Labels */}
      <div className="range-axis">
        <span>{formatNumber(range.min)}</span>
        <span>{formatNumber(range.max)}</span>
      </div>
    </div>
  );
}
