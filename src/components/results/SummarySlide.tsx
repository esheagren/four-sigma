interface SummarySlideProps {
  totalScore: number;
  calibration?: number;
  calibrationHistory?: number[];
  hits: number;
  total: number;
  percentile?: number;
  dailyRank?: number;
  onShare: () => void;
  isSharing: boolean;
}

function CircularCalibration({ percentage, size = 80 }: { percentage: number; size?: number }) {
  const strokeWidth = 6;
  const center = size / 2;
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="calibration-dial" style={{ width: size, height: size }}>
      <svg className="calibration-svg" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="calibration-progress"
        />
      </svg>
      <div className="calibration-dial-center">
        <span className="calibration-dial-value">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

function CalibrationHistoryChart({ history, current }: { history: number[]; current: number }) {
  // Include current calibration at the end
  const data = [...(history || []), current].slice(-7); // Last 7 sessions max
  const targetLine = 95;

  // If no history, show placeholder
  if (data.length <= 1) {
    return (
      <div className="calibration-history-chart">
        <div className="calibration-chart-empty">
          <span>Play more to see your trend</span>
        </div>
        <div className="calibration-target-label">95% target</div>
      </div>
    );
  }

  const maxVal = Math.max(...data, targetLine);
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;

  const chartHeight = 60;
  const chartWidth = 140;
  const padding = 4;

  // Calculate points for the line
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((val - minVal) / range) * (chartHeight - padding * 2);
    return { x, y, val };
  });

  // Create path
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Target line Y position
  const targetY = chartHeight - padding - ((targetLine - minVal) / range) * (chartHeight - padding * 2);

  return (
    <div className="calibration-history-chart">
      <div className="calibration-target-label">95% target</div>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="calibration-chart-svg">
        {/* Target line at 95% */}
        <line
          x1={padding}
          y1={targetY}
          x2={chartWidth - padding}
          y2={targetY}
          stroke="#10b981"
          strokeWidth="1"
          strokeDasharray="4 2"
          opacity="0.6"
        />

        {/* History line */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current point (last point highlighted) */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="4"
          fill="#10b981"
        />

        {/* Previous points */}
        {points.slice(0, -1).map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2"
            fill="rgba(255,255,255,0.4)"
          />
        ))}
      </svg>
    </div>
  );
}

export function SummarySlide({
  totalScore,
  calibration = 0,
  calibrationHistory,
  hits,
  total,
  percentile,
  dailyRank,
  onShare,
  isSharing,
}: SummarySlideProps) {
  return (
    <div className="tiktok-slide summary-slide">
      {/* Background Grid */}
      <div className="summary-grid-bg" />

      <div className="summary-content">
        {/* Session Complete Label */}
        <div className="summary-complete-label">Session Complete</div>

        {/* Total Score */}
        <div className="summary-score-section">
          <div className="summary-score-label">Total Score</div>
          <div className="summary-score-value">{Math.round(totalScore).toLocaleString()}</div>
          <div className="summary-hits">
            {hits}/{total} questions hit
          </div>
        </div>

        {/* Calibration Section - Dial left, History right */}
        <div className="calibration-section">
          <div className="calibration-left">
            <CircularCalibration percentage={calibration} size={80} />
            <span className="calibration-section-label">Calibration</span>
          </div>
          <div className="calibration-right">
            <CalibrationHistoryChart history={calibrationHistory || []} current={calibration} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="summary-stats-grid">
          {dailyRank && (
            <div className="summary-stat">
              <span className="summary-stat-label">Rank</span>
              <span className="summary-stat-value">#{dailyRank}</span>
            </div>
          )}
          {percentile !== undefined && (
            <div className="summary-stat">
              <span className="summary-stat-label">Percentile</span>
              <span className="summary-stat-value">{percentile}%</span>
            </div>
          )}
        </div>

        {/* Share Button */}
        <button
          className="summary-share-btn icon-only"
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
  );
}
