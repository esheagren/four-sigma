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
  calibration?: number; // Percentage (0-100) of submissions that contained the true value
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
  calibration,
  onShare,
  isSharing
}: DailyScoreCardProps) {
  const [showCalibrationPopup, setShowCalibrationPopup] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'overall' | 'bestGuesses'>('overall');
  const [overallLeaderboard, setOverallLeaderboard] = useState<OverallEntry[]>([]);
  const [bestGuessesLeaderboard, setBestGuessesLeaderboard] = useState<BestGuessEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Fetch leaderboards on mount
  useEffect(() => {
    fetchLeaderboards();
  }, []);

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

  // Determine calibration status for styling
  const getCalibrationStatus = (cal: number | undefined) => {
    if (cal === undefined) return 'unknown';
    if (cal >= 93 && cal <= 97) return 'excellent'; // Well calibrated (near 95%)
    if (cal >= 85) return 'good'; // Slightly overconfident
    if (cal >= 70) return 'fair'; // Moderately overconfident
    return 'poor'; // Significantly overconfident
  };

  const calibrationStatus = calibration !== undefined ? getCalibrationStatus(calibration) : 'unknown';

  return (
    <div className="daily-score-card">
      <div className="score-layout">
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

        {/* Top Row - Total Score, Daily Rank, Calibration - Always visible */}
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

        {/* Leaderboard Section */}
        <div className="leaderboard-section">
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
      </div>
    </div>
  );
}
