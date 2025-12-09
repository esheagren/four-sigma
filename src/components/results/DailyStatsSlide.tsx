interface QuestionHighScore {
  questionId: string;
  prompt: string;
  highestScore: number;
  username?: string;
}

interface DailyStatsSlideProps {
  totalScore: number;
  topScoreToday?: number;
  hits: number;
  total: number;
  questionHighScores?: QuestionHighScore[];
  onShare: () => void;
  isSharing: boolean;
}

export function DailyStatsSlide({
  totalScore,
  topScoreToday,
  hits,
  total,
  questionHighScores,
  onShare,
  isSharing,
}: DailyStatsSlideProps) {
  return (
    <div className="tiktok-slide daily-stats-slide">
      <div className="summary-grid-bg" />

      <div className="daily-stats-content">
        <div className="daily-stats-header">Session Complete</div>

        {/* Score Section with Share Button */}
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

        {/* Today's High Score */}
        {topScoreToday !== undefined && (
          <div className="daily-high-score">
            <span className="daily-high-label">Today's Best</span>
            <span className="daily-high-value">{Math.round(topScoreToday).toLocaleString()}</span>
          </div>
        )}

        {/* Per-Question High Scores */}
        {questionHighScores && questionHighScores.length > 0 && (
          <div className="question-high-scores">
            <div className="question-high-scores-header">Question Leaders</div>
            <div className="question-high-scores-list">
              {questionHighScores.map((q, index) => (
                <div key={q.questionId} className="question-high-score-item">
                  <span className="question-number">Q{index + 1}</span>
                  <span className="question-high-score-value">+{Math.round(q.highestScore)}</span>
                  {q.username && (
                    <span className="question-high-score-user">{q.username}</span>
                  )}
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
  );
}
