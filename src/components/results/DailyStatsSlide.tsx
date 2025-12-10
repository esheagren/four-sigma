import { forwardRef } from 'react';

interface QuestionHighScore {
  questionId: string;
  prompt: string;
  highestScore: number;
  username?: string;
}

interface TodayLeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  isCurrentUser?: boolean;
}

interface DailyStatsSlideProps {
  totalScore: number;
  hits: number;
  total: number;
  questionHighScores?: QuestionHighScore[];
  todayLeaderboard?: TodayLeaderboardEntry[];
  onShare: () => void;
  isSharing: boolean;
}

export const DailyStatsSlide = forwardRef<HTMLDivElement, DailyStatsSlideProps>(({
  totalScore,
  hits,
  total,
  questionHighScores,
  todayLeaderboard,
  onShare,
  isSharing,
}, ref) => {
  // Determine glow color based on performance
  const isTopScorer = todayLeaderboard?.some(entry => entry.isCurrentUser && entry.rank === 1);
  const isZeroScore = totalScore === 0;

  const scoreGlowClass = isZeroScore
    ? 'score-glow-gray'
    : isTopScorer
      ? 'score-glow-gold'
      : 'score-glow-purple';

  return (
    <div className="tiktok-slide daily-stats-slide" ref={ref}>
      <div className="slide-body">
        <div className="daily-stats-content">

        {/* Section 1: Today's Leaderboard (Top 5) */}
        {todayLeaderboard && todayLeaderboard.length > 0 && (
          <div className="today-leaderboard">
            <div className="today-leaderboard-header">Today's Leaderboard</div>
            <div className="today-leaderboard-list">
              {todayLeaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`leaderboard-entry ${entry.isCurrentUser ? 'is-current-user' : ''}`}
                >
                  <span className="leaderboard-rank">#{entry.rank}</span>
                  <span className="leaderboard-username">{entry.username}</span>
                  <span className="leaderboard-score">{entry.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Your Score (Middle) */}
        <div className={`daily-score-section ${scoreGlowClass}`}>
          <div className="daily-score-row">
            <div className="daily-score-main">
              <div className="daily-score-label">Your Score</div>
              <div className="daily-score-value">{Math.round(totalScore).toLocaleString()}</div>
              <div className="daily-score-hits">{hits}/{total} questions hit</div>
            </div>
            <button
              className="daily-share-btn"
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

        {/* Section 3: Question Leaders (Bottom) */}
        {questionHighScores && questionHighScores.length > 0 && (
          <div className="question-leaders">
            <div className="question-leaders-header">Question Leaders</div>
            <div className="question-leaders-list">
              {questionHighScores.map((q) => (
                <div key={q.questionId} className="question-leader-item">
                  <div className="question-leader-header-row">
                    <span className="question-leader-username">{q.username || 'Anonymous'}</span>
                    <span className="question-leader-score">+{Math.round(q.highestScore)}</span>
                  </div>
                  <div className="question-leader-prompt">{q.prompt}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scroll hint */}
        <div className="slide-scroll-hint">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
        </div>
      </div>
    </div>
  );
});

DailyStatsSlide.displayName = 'DailyStatsSlide';
