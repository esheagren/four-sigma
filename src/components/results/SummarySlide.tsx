interface SummarySlideProps {
  totalScore: number;
  calibration?: number;
  hits: number;
  total: number;
  percentile?: number;
  dailyRank?: number;
  onShare: () => void;
  isSharing: boolean;
}

function CircularCalibration({ percentage, size = 140 }: { percentage: number; size?: number }) {
  const strokeWidth = 10;
  const center = size / 2;
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="calibration-circle" style={{ width: size, height: size }}>
      <div className="calibration-glow" />
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
      <div className="calibration-center">
        <span className="calibration-value">{percentage}%</span>
        <span className="calibration-label">Calibration</span>
      </div>
    </div>
  );
}

export function SummarySlide({
  totalScore,
  calibration = 0,
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

        {/* Calibration Circle */}
        <div className="summary-calibration">
          <CircularCalibration percentage={calibration} size={140} />
        </div>

        {/* Total Score */}
        <div className="summary-score-section">
          <div className="summary-score-label">Total Score</div>
          <div className="summary-score-value">{totalScore.toLocaleString()}</div>
          <div className="summary-hits">
            {hits}/{total} questions hit
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
          className="summary-share-btn"
          onClick={onShare}
          disabled={isSharing}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {isSharing ? 'Sharing...' : 'Share Results'}
        </button>
      </div>
    </div>
  );
}
