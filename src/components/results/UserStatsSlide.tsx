interface PerformanceHistoryEntry {
  date: string;
  day: string;
  userScore: number;
  avgScore: number;
  calibration: number;
}

interface UserStatsSlideProps {
  calibration: number;
  performanceHistory?: PerformanceHistoryEntry[];
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

function CalibrationHistoryChart({ history }: { history: PerformanceHistoryEntry[] }) {
  const data = history.slice(-7).map(h => h.calibration);
  const targetLine = 95;

  if (data.length <= 1) {
    return (
      <div className="calibration-history-chart">
        <div className="calibration-target-label">95% target</div>
        <div className="calibration-chart-empty">
          <span>Play more to see your trend</span>
        </div>
      </div>
    );
  }

  const maxVal = Math.max(...data, targetLine);
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;

  const chartHeight = 60;
  const chartWidth = 140;
  const padding = 4;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((val - minVal) / range) * (chartHeight - padding * 2);
    return { x, y, val };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const targetY = chartHeight - padding - ((targetLine - minVal) / range) * (chartHeight - padding * 2);

  return (
    <div className="calibration-history-chart">
      <div className="calibration-target-label">95% target</div>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="calibration-chart-svg">
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
        <path
          d={pathD}
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="4"
          fill="#10b981"
        />
        {points.slice(0, -1).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill="rgba(255,255,255,0.4)" />
        ))}
      </svg>
    </div>
  );
}

function ScoreHistoryChart({ history }: { history: PerformanceHistoryEntry[] }) {
  const data = history.slice(-7);

  if (data.length <= 1) {
    return (
      <div className="score-history-chart">
        <div className="score-chart-empty">
          <span>Play more to see your score trend</span>
        </div>
      </div>
    );
  }

  const userScores = data.map(h => h.userScore);
  const avgScores = data.map(h => h.avgScore);
  const allScores = [...userScores, ...avgScores];

  const maxVal = Math.max(...allScores);
  const minVal = Math.min(...allScores, 0);
  const range = maxVal - minVal || 1;

  const chartHeight = 80;
  const chartWidth = 280;
  const padding = 8;

  const userPoints = userScores.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((val - minVal) / range) * (chartHeight - padding * 2);
    return { x, y, val };
  });

  const avgPoints = avgScores.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((val - minVal) / range) * (chartHeight - padding * 2);
    return { x, y, val };
  });

  const userPathD = userPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const avgPathD = avgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="score-history-chart">
      <div className="score-chart-legend">
        <span className="legend-item user">
          <span className="legend-dot user" />
          You
        </span>
        <span className="legend-item avg">
          <span className="legend-dot avg" />
          Average
        </span>
      </div>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="score-chart-svg">
        {/* Average line (behind) */}
        <path
          d={avgPathD}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4 2"
        />
        {/* User line (front) */}
        <path
          d={userPathD}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* User points */}
        {userPoints.map((p, i) => (
          <circle key={`user-${i}`} cx={p.x} cy={p.y} r={i === userPoints.length - 1 ? 4 : 2} fill="#10b981" />
        ))}
        {/* Avg points */}
        {avgPoints.map((p, i) => (
          <circle key={`avg-${i}`} cx={p.x} cy={p.y} r="2" fill="rgba(255,255,255,0.4)" />
        ))}
      </svg>
      {/* Day labels */}
      <div className="score-chart-days">
        {data.map((d, i) => (
          <span key={i} className="day-label">{d.day}</span>
        ))}
      </div>
    </div>
  );
}

export function UserStatsSlide({
  calibration,
  performanceHistory = [],
}: UserStatsSlideProps) {
  return (
    <div className="tiktok-slide user-stats-slide">
      <div className="summary-grid-bg" />

      <div className="user-stats-content">
        <div className="user-stats-header">Your Stats</div>

        {/* Calibration Section */}
        <div className="user-stats-section">
          <div className="user-stats-section-title">Calibration</div>
          <div className="calibration-section">
            <div className="calibration-left">
              <CircularCalibration percentage={calibration} size={80} />
              <span className="calibration-section-label">Current</span>
            </div>
            <div className="calibration-right">
              <CalibrationHistoryChart history={performanceHistory} />
            </div>
          </div>
        </div>

        {/* Score History Section */}
        <div className="user-stats-section">
          <div className="user-stats-section-title">Score Over Time</div>
          <ScoreHistoryChart history={performanceHistory} />
        </div>
      </div>
    </div>
  );
}
