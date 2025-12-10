import { forwardRef, useState } from 'react';

interface PerformanceHistoryEntry {
  date: string;
  day: string;
  userScore: number;
  avgScore: number;
  calibration: number;
}

interface CalibrationMilestone {
  date: string;
  label: string;
  calibration: number;
}

interface UserStats {
  gamesPlayed: number;
  averageScore: number;
  bestSingleScore: number;
  currentStreak: number;
  bestStreak: number;
}

interface UserStatsSlideProps {
  calibration: number;
  performanceHistory?: PerformanceHistoryEntry[];
  calibrationMilestones?: CalibrationMilestone[];
  userStats?: UserStats;
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

function CalibrationHistoryChart({ milestones }: { milestones: CalibrationMilestone[] }) {
  const targetLine = 95;

  if (milestones.length < 2) {
    return (
      <div className="calibration-history-chart">
        <div className="calibration-target-label">95% target</div>
        <div className="calibration-chart-empty">
          <span>Play more to see your trend</span>
        </div>
      </div>
    );
  }

  const data = milestones.map(m => m.calibration);
  const maxVal = Math.max(...data, targetLine);
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;

  const chartHeight = 70;
  const chartWidth = 180;
  const paddingX = 8;
  const paddingTop = 4;
  const paddingBottom = 16; // Extra space for labels

  const points = data.map((val, i) => {
    const x = paddingX + (i / (data.length - 1)) * (chartWidth - paddingX * 2);
    const y = paddingTop + (1 - (val - minVal) / range) * (chartHeight - paddingTop - paddingBottom);
    return { x, y, val, label: milestones[i].label };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const targetY = paddingTop + (1 - (targetLine - minVal) / range) * (chartHeight - paddingTop - paddingBottom);

  return (
    <div className="calibration-history-chart">
      <div className="calibration-target-label">95% target</div>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="calibration-chart-svg">
        {/* Target line */}
        <line
          x1={paddingX}
          y1={targetY}
          x2={chartWidth - paddingX}
          y2={targetY}
          stroke="#10b981"
          strokeWidth="1"
          strokeDasharray="4 2"
          opacity="0.6"
        />
        {/* Data line */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 4 : 2}
            fill={i === points.length - 1 ? '#10b981' : 'rgba(255,255,255,0.4)'}
          />
        ))}
        {/* Date labels */}
        {points.map((p, i) => (
          <text
            key={`label-${i}`}
            x={p.x}
            y={chartHeight - 2}
            textAnchor="middle"
            className="calibration-chart-date-label"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function CalibrationSection({ calibration, performanceHistory }: { calibration: number; performanceHistory: PerformanceHistoryEntry[] }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="user-stats-section">
      <div className="user-stats-section-title">
        Calibration
        <button
          className="calibration-info-button"
          onClick={() => setShowInfo(true)}
          aria-label="What is calibration?"
        >
          i
        </button>
      </div>
      <div className="calibration-section">
        <div className="calibration-left">
          <CircularCalibration percentage={calibration} size={80} />
          <span className="calibration-section-label">Current</span>
        </div>
        <div className="calibration-right">
          <CalibrationHistoryChart history={performanceHistory} />
        </div>
      </div>

      {showInfo && (
        <div className="calibration-info-overlay" onClick={() => setShowInfo(false)}>
          <div className="calibration-info-popup" onClick={(e) => e.stopPropagation()}>
            <button className="calibration-info-close" onClick={() => setShowInfo(false)}>
              &times;
            </button>
            <h3>What is Calibration?</h3>
            <p>
              Calibration measures how often the true answer falls within your confidence interval.
            </p>
            <p>
              A calibration score of 95% means you're capturing the true answer in 95 out of 100 questions.
            </p>
            <p>
              <strong>Goal:</strong> Aim for 95% calibration. Being well-calibrated means you have
              accurate uncertainty about what you know and don't know.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreHistoryChart({ history }: { history: PerformanceHistoryEntry[] }) {
  const data = history.slice(-10);

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

export const UserStatsSlide = forwardRef<HTMLDivElement, UserStatsSlideProps>(({
  calibration,
  performanceHistory = [],
  userStats,
}, ref) => {
  return (
    <div className="tiktok-slide user-stats-slide" ref={ref}>
      <div className="slide-body">
        <div className="user-stats-content">
          <div className="user-stats-header">Your Stats</div>

        {/* Score History Section */}
        <div className="user-stats-section">
          <ScoreHistoryChart history={performanceHistory} />
        </div>

        {/* Calibration Section */}
        <CalibrationSection calibration={calibration} performanceHistory={performanceHistory} />

        {/* Statistics Grid */}
        {userStats && (
          <div className="user-stats-section">
            <div className="user-stats-grid">
              <div className="user-stat-item">
                <div className="user-stat-value">{userStats.gamesPlayed}</div>
                <div className="user-stat-label">Games</div>
              </div>
              <div className="user-stat-item">
                <div className="user-stat-value">{Math.round(userStats.averageScore)}</div>
                <div className="user-stat-label">Avg Score</div>
              </div>
              <div className="user-stat-item">
                <div className="user-stat-value">{userStats.bestSingleScore.toLocaleString()}</div>
                <div className="user-stat-label">Best Score</div>
              </div>
              <div className="user-stat-item">
                <div className="user-stat-value">{userStats.currentStreak}</div>
                <div className="user-stat-label">Streak</div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
});

UserStatsSlide.displayName = 'UserStatsSlide';
