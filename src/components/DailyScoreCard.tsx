import { useState, useEffect } from 'react';

interface OverallEntry {
  rank: number;
  displayName: string;
  totalScore: number;
  gamesPlayed: number;
  averageScore: string;
}

interface BestGuessEntry {
  rank: number;
  displayName: string;
  score: number;
  questionText: string;
  lowerBound: number;
  upperBound: number;
  trueValue: number;
  answeredAt: string;
}

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
  onShare?: () => void;
  isSharing?: boolean;
}

// Animated counter component for total score with easing
function AnimatedTotalScore({ finalScore }: { finalScore: number }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const duration = 1800; // 1.8 seconds for more gradual effect
    const startTime = Date.now();

    // Ease-out quint function: more gradual slowdown
    const easeOutQuint = (t: number): number => {
      return 1 - Math.pow(1 - t, 5);
    };

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Apply easing function
      const easedProgress = easeOutQuint(progress);
      const currentScore = Math.floor(easedProgress * finalScore);

      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayScore(finalScore); // Ensure we end exactly on the final score
      }
    };

    requestAnimationFrame(animate);
  }, [finalScore]);

  return <>{displayScore}</>;
}

export function DailyScoreCard({
  totalScore,
  dailyRank,
  topScoreGlobal,
  dailyAverageScore,
  calibration,
  performanceHistory,
  onShare,
  isSharing
}: DailyScoreCardProps) {
  const [showCalibrationPopup, setShowCalibrationPopup] = useState(false);
  const [activeView, setActiveView] = useState<'performance' | 'leaderboard'>('performance');
  const [leaderboardTab, setLeaderboardTab] = useState<'overall' | 'bestGuesses'>('overall');
  const [overallLeaderboard, setOverallLeaderboard] = useState<OverallEntry[]>([]);
  const [bestGuessesLeaderboard, setBestGuessesLeaderboard] = useState<BestGuessEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Fetch leaderboards when switching to leaderboard view
  useEffect(() => {
    if (activeView === 'leaderboard' && overallLeaderboard.length === 0) {
      fetchLeaderboards();
    }
  }, [activeView]);

  const fetchLeaderboards = async () => {
    setLeaderboardLoading(true);
    try {
      const [overallRes, bestGuessesRes] = await Promise.all([
        fetch('/api/session/leaderboard/overall'),
        fetch('/api/session/leaderboard/best-guesses'),
      ]);

      if (overallRes.ok) {
        const overallData = await overallRes.json();
        setOverallLeaderboard(overallData.leaderboard || []);
      }
      if (bestGuessesRes.ok) {
        const bestGuessesData = await bestGuessesRes.json();
        setBestGuessesLeaderboard(bestGuessesData.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboards:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const truncateQuestion = (text: string, maxLength: number = 35) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

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
        {/* Top Row - Total Score, Daily Rank, Calibration */}
        <div className="score-top-row score-top-row-three">
          {/* Total Score */}
          <div className="stat-item stat-primary">
            {onShare && (
              <button
                className="share-icon-button"
                onClick={onShare}
                disabled={isSharing}
                aria-label="Share score"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              </button>
            )}
            <div className="stat-value-large">
              <AnimatedTotalScore finalScore={Math.round(totalScore)} />
            </div>
            <div className="stat-label">Total score</div>
          </div>

          {/* Daily Rank */}
          <div className="stat-item stat-rank">
            <div className="stat-value-rank">{dailyRank ? `#${dailyRank}` : '—'}</div>
            <div className="stat-label">Daily rank</div>
          </div>

          {/* Calibration - Smaller */}
          <div className={`stat-item stat-calibration-small calibration-${calibrationStatus}`}>
            <div className="stat-value-calibration-small">
              {calibration !== undefined ? `${calibration.toFixed(0)}%` : '—'}
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

        {/* View Toggle */}
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${activeView === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveView('performance')}
          >
            Your Performance
          </button>
          <button
            className={`view-toggle-btn ${activeView === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveView('leaderboard')}
          >
            Leaderboard
          </button>
        </div>

        {activeView === 'performance' ? (
        <>
        {/* Performance Chart */}
        <div className="performance-chart">
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
        </>
        ) : (
        /* Leaderboard View */
        <div className="leaderboard-section">
          {dailyAverageScore && (
            <div className="leaderboard-avg-banner">
              Today's Average: <strong>{Math.round(dailyAverageScore)}</strong> points
            </div>
          )}

          <div className="leaderboard-subtabs">
            <button
              className={`leaderboard-subtab ${leaderboardTab === 'overall' ? 'active' : ''}`}
              onClick={() => setLeaderboardTab('overall')}
            >
              Overall Score
            </button>
            <button
              className={`leaderboard-subtab ${leaderboardTab === 'bestGuesses' ? 'active' : ''}`}
              onClick={() => setLeaderboardTab('bestGuesses')}
            >
              Best Guesses
            </button>
          </div>

          {leaderboardLoading ? (
            <div className="leaderboard-loading">Loading...</div>
          ) : leaderboardTab === 'overall' ? (
            <div className="leaderboard-list-inline">
              {overallLeaderboard.length === 0 ? (
                <div className="leaderboard-empty">No scores yet</div>
              ) : (
                overallLeaderboard.map((entry) => (
                  <div key={`overall-${entry.rank}`} className="leaderboard-entry-inline">
                    <span className={`rank-badge ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}`}>
                      #{entry.rank}
                    </span>
                    <span className="entry-name">{entry.displayName}</span>
                    <span className="entry-score">{entry.totalScore.toLocaleString()}</span>
                    <span className="entry-meta">{entry.gamesPlayed} games</span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="leaderboard-list-guesses">
              {bestGuessesLeaderboard.length === 0 ? (
                <div className="leaderboard-empty">No guesses yet</div>
              ) : (
                bestGuessesLeaderboard.map((entry) => {
                  // Check if we have the visualization data
                  const hasVisualizationData = entry.lowerBound != null && entry.upperBound != null && entry.trueValue != null;

                  // Calculate visualization percentages (only if we have data)
                  let lowerPercent = 20;
                  let upperPercent = 80;
                  let trueValuePercent = 50;
                  let spanWidth = 60;

                  if (hasVisualizationData) {
                    const range = entry.upperBound - entry.lowerBound;
                    const padding = Math.max(range * 0.3, Math.abs(entry.trueValue) * 0.1); // Add padding
                    const scaleMin = Math.min(entry.lowerBound - padding, entry.trueValue - padding);
                    const scaleMax = Math.max(entry.upperBound + padding, entry.trueValue + padding);
                    const scaleRange = scaleMax - scaleMin || 1; // Prevent division by zero

                    lowerPercent = ((entry.lowerBound - scaleMin) / scaleRange) * 100;
                    upperPercent = ((entry.upperBound - scaleMin) / scaleRange) * 100;
                    trueValuePercent = ((entry.trueValue - scaleMin) / scaleRange) * 100;
                    spanWidth = upperPercent - lowerPercent;
                  }

                  return (
                    <div key={`guess-${entry.rank}`} className="best-guess-entry">
                      <div className="best-guess-header">
                        <span className={`rank-badge ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}`}>
                          #{entry.rank}
                        </span>
                        <span className="entry-name">{entry.displayName}</span>
                        <span className="entry-score">{entry.score.toLocaleString()} pts</span>
                      </div>
                      <div className="best-guess-question" title={entry.questionText}>
                        {truncateQuestion(entry.questionText, 50)}
                      </div>
                      {hasVisualizationData && (
                        <>
                          <div className="best-guess-visualization">
                            <div className="best-guess-range-line" />

                            {/* Span between bounds */}
                            <div
                              className="best-guess-range-span"
                              style={{
                                left: `${lowerPercent}%`,
                                width: `${spanWidth}%`,
                              }}
                            />

                            {/* True value marker */}
                            <div
                              className="best-guess-true-marker"
                              style={{ left: `${trueValuePercent}%` }}
                            >
                              <div className="best-guess-true-dot" />
                            </div>

                            {/* Lower bound */}
                            <div
                              className="best-guess-bound best-guess-bound-lower"
                              style={{ left: `${lowerPercent}%` }}
                            >
                              <div className="best-guess-bound-dot" />
                              <div className="best-guess-bound-label">
                                {entry.lowerBound.toLocaleString()}
                              </div>
                            </div>

                            {/* Upper bound */}
                            <div
                              className="best-guess-bound best-guess-bound-upper"
                              style={{ left: `${upperPercent}%` }}
                            >
                              <div className="best-guess-bound-dot" />
                              <div className="best-guess-bound-label">
                                {entry.upperBound.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="best-guess-answer">
                            Answer: <strong>{entry.trueValue.toLocaleString()}</strong>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
