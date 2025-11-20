import { useState } from 'react';

interface DailyScoreCardProps {
  totalScore: number;
  dailyRank?: number;
  topScoreGlobal?: number;
  averageScore?: number; // User's all-time average score
  dailyAverageScore?: number; // Average score across all users today
  calibration?: number; // Percentage (0-100) of submissions that contained the true value
  performanceHistory?: Array<{
    day: string;
    userScore: number;
    avgScore: number;
    calibration: number;
  }>;
}

export function DailyScoreCard({
  totalScore,
  dailyRank,
  topScoreGlobal,
  averageScore,
  dailyAverageScore,
  calibration,
  performanceHistory
}: DailyScoreCardProps) {
  const [showCalibrationPopup, setShowCalibrationPopup] = useState(false);

  // Mock data for demonstration - will be replaced with real data from backend
  const mockHistory = performanceHistory || [
    { day: 'M', userScore: 45, avgScore: 38, calibration: 67 },
    { day: 'T', userScore: 62, avgScore: 52, calibration: 71 },
    { day: 'W', userScore: 58, avgScore: 49, calibration: 75 },
    { day: 'Th', userScore: 71, avgScore: 55, calibration: 80 },
    { day: 'F', userScore: 53, avgScore: 48, calibration: 78 },
    { day: 'S', userScore: 68, avgScore: 51, calibration: 85 },
    { day: 'Su', userScore: 75, avgScore: 54, calibration: 88 },
  ];

  // Determine calibration status for styling
  const getCalibrationStatus = (cal: number | undefined) => {
    if (cal === undefined) return 'unknown';
    if (cal >= 93 && cal <= 97) return 'excellent'; // Well calibrated (near 95%)
    if (cal >= 85) return 'good'; // Slightly overconfident
    if (cal >= 70) return 'fair'; // Moderately overconfident
    return 'poor'; // Significantly overconfident
  };

  const calibrationStatus = calibration !== undefined ? getCalibrationStatus(calibration) : 'unknown';

  // Calculate chart dimensions
  const maxScore = Math.max(
    ...mockHistory.map(d => Math.max(d.userScore, d.avgScore)),
    100
  );
  const maxCalibration = 100; // Calibration is always 0-100%
  const chartHeight = 200;
  const chartWidth = 600;
  const padding = { top: 20, right: 50, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Generate SVG path for score lines (left axis)
  const generateScorePath = (data: number[]) => {
    return data
      .map((score, i) => {
        const x = padding.left + (i / (data.length - 1)) * innerWidth;
        const y = padding.top + innerHeight - (score / maxScore) * innerHeight;
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');
  };

  // Generate SVG path for calibration line (right axis)
  const generateCalibrationPath = (data: number[]) => {
    return data
      .map((cal, i) => {
        const x = padding.left + (i / (data.length - 1)) * innerWidth;
        const y = padding.top + innerHeight - (cal / maxCalibration) * innerHeight;
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');
  };

  const userPath = generateScorePath(mockHistory.map(d => d.userScore));
  const avgPath = generateScorePath(mockHistory.map(d => d.avgScore));
  const calibrationPath = generateCalibrationPath(mockHistory.map(d => d.calibration));

  return (
    <div className="daily-score-card">
      <div className="score-layout">
        {/* Top Row - Total Score & Calibration */}
        <div className="score-top-row">
          {/* Total Score - Left */}
          <div className="stat-item stat-primary">
            <div className="stat-value-large">{Math.round(totalScore)}</div>
            <div className="stat-label">Total score</div>
          </div>

          {/* Calibration - Right */}
          <div className={`stat-item stat-calibration calibration-${calibrationStatus}`}>
            <div className="stat-value-calibration">
              {calibration !== undefined ? `${calibration.toFixed(1)}%` : '—'}
            </div>
            <div className="stat-label calibration-label-with-info">
              Calibration
              <button
                className="calibration-info-button"
                onClick={() => setShowCalibrationPopup(true)}
                aria-label="What is calibration?"
              >
                ⓘ
              </button>
            </div>
            {calibration !== undefined && (
              <div className="calibration-target">Target: 95%</div>
            )}
          </div>
        </div>

        {/* Calibration Info Popup */}
        {showCalibrationPopup && (
          <div className="modal-overlay" onClick={() => setShowCalibrationPopup(false)}>
            <div className="modal-content calibration-popup" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>What is Calibration?</h2>
              </div>
              <div className="modal-body">
                <p>
                  Calibration measures how well your confidence intervals match reality. It's the percentage of your 95% confidence intervals that actually contained the correct answer.
                </p>
                <p>
                  <strong>Well-calibrated forecasters hit 95%.</strong> If you make 100 predictions with 95% confidence intervals, about 95 should contain the true value.
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
          </div>
        )}

        {/* Middle Row - Secondary Stats (Horizontal) */}
        <div className="stat-row-horizontal">
          <div className="stat-item-small">
            <div className="stat-value-small">{dailyRank ? `#${dailyRank}` : '—'}</div>
            <div className="stat-label-small">Daily rank</div>
          </div>
          <div className="stat-item-small">
            <div className="stat-value-small">{topScoreGlobal ? topScoreGlobal.toFixed(2) : '—'}</div>
            <div className="stat-label-small">Top score today</div>
          </div>
          <div className="stat-item-small">
            <div className="stat-value-small">{dailyAverageScore ? dailyAverageScore.toFixed(2) : '—'}</div>
            <div className="stat-label-small">Today's average</div>
          </div>
        </div>

        {/* Bottom Row - Performance Chart (Full Width) */}
        <div className="performance-chart">
          <h3 className="chart-title">Your Performance</h3>
          <svg
            width={chartWidth}
            height={chartHeight}
            className="chart-svg"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          >
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((value) => {
              const y = padding.top + innerHeight - (value / maxScore) * innerHeight;
              return (
                <line
                  key={`grid-${value}`}
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e3e8ee"
                  strokeWidth="1"
                  opacity="0.3"
                />
              );
            })}

            {/* Left Y-axis (Score) */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={chartHeight - padding.bottom}
              stroke="#635bff"
              strokeWidth="1"
            />

            {/* Left Y-axis labels (Score) */}
            {[0, 25, 50, 75, 100].map((value) => {
              const y = padding.top + innerHeight - (value / maxScore) * innerHeight;
              return (
                <text
                  key={`left-label-${value}`}
                  x={padding.left - 10}
                  y={y}
                  textAnchor="end"
                  fontSize="10"
                  fill="#635bff"
                  fontWeight="500"
                  dominantBaseline="middle"
                >
                  {value}
                </text>
              );
            })}

            {/* Right Y-axis (Calibration %) */}
            <line
              x1={chartWidth - padding.right}
              y1={padding.top}
              x2={chartWidth - padding.right}
              y2={chartHeight - padding.bottom}
              stroke="#00d924"
              strokeWidth="1"
            />

            {/* Right Y-axis labels (Calibration %) */}
            {[0, 25, 50, 75, 100].map((value) => {
              const y = padding.top + innerHeight - (value / maxCalibration) * innerHeight;
              return (
                <text
                  key={`right-label-${value}`}
                  x={chartWidth - padding.right + 10}
                  y={y}
                  textAnchor="start"
                  fontSize="10"
                  fill="#00d924"
                  fontWeight="500"
                  dominantBaseline="middle"
                >
                  {value}%
                </text>
              );
            })}

            {/* Average score line */}
            <path
              d={avgPath}
              fill="none"
              stroke="#9d98d4"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* User score line */}
            <path
              d={userPath}
              fill="none"
              stroke="#635bff"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Calibration line */}
            <path
              d={calibrationPath}
              fill="none"
              stroke="#00d924"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Data points for user score */}
            {mockHistory.map((d, i) => {
              const x = padding.left + (i / (mockHistory.length - 1)) * innerWidth;
              const yScore = padding.top + innerHeight - (d.userScore / maxScore) * innerHeight;
              return (
                <circle
                  key={`user-${i}`}
                  cx={x}
                  cy={yScore}
                  r="4"
                  fill="#635bff"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              );
            })}

            {/* Data points for calibration */}
            {mockHistory.map((d, i) => {
              const x = padding.left + (i / (mockHistory.length - 1)) * innerWidth;
              const yCal = padding.top + innerHeight - (d.calibration / maxCalibration) * innerHeight;
              return (
                <circle
                  key={`cal-${i}`}
                  cx={x}
                  cy={yCal}
                  r="4"
                  fill="#00d924"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              );
            })}

            {/* X-axis labels */}
            {mockHistory.map((d, i) => {
              const x = padding.left + (i / (mockHistory.length - 1)) * innerWidth;
              return (
                <text
                  key={`label-${i}`}
                  x={x}
                  y={chartHeight - 15}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#8898aa"
                  fontWeight="600"
                >
                  {d.day}
                </text>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-line legend-line-user"></div>
              <span className="legend-label">Your score</span>
            </div>
            <div className="legend-item">
              <div className="legend-line legend-line-avg"></div>
              <span className="legend-label">Average score</span>
            </div>
            <div className="legend-item">
              <div className="legend-line legend-line-calibration"></div>
              <span className="legend-label">Your Calibration</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
