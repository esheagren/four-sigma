import { forwardRef } from 'react';

interface QuestionHighScore {
  questionId: string;
  prompt: string;
  highestScore: number;
  username?: string;
  lowerBound?: number;
  upperBound?: number;
}

interface QuestionLeadersSlideProps {
  questionHighScores?: QuestionHighScore[];
}

export const QuestionLeadersSlide = forwardRef<HTMLDivElement, QuestionLeadersSlideProps>(({
  questionHighScores,
}, ref) => {
  // Format the bounds for display
  const formatBounds = (lower?: number, upper?: number) => {
    if (lower === undefined || upper === undefined) return null;

    // Format numbers nicely
    const formatNum = (n: number) => {
      if (Math.abs(n) >= 1000000) {
        return (n / 1000000).toFixed(1) + 'M';
      }
      if (Math.abs(n) >= 1000) {
        return (n / 1000).toFixed(1) + 'K';
      }
      return n.toLocaleString();
    };

    return `${formatNum(lower)} – ${formatNum(upper)}`;
  };

  return (
    <div className="tiktok-slide question-leaders-slide" ref={ref}>
      <div className="slide-body">
        <div className="question-leaders-content">
          <div className="question-leaders-header">Question Leaders</div>

          {questionHighScores && questionHighScores.length > 0 ? (
            <div className="question-leaders-list">
              {questionHighScores.map((q) => (
                <div key={q.questionId} className="question-leader-item">
                  <div className="question-leader-header-row">
                    <span className="question-leader-username">{q.username || 'Anonymous'}</span>
                    <span className="question-leader-score">+{Math.round(q.highestScore)}</span>
                  </div>
                  <div className="question-leader-prompt">{q.prompt}</div>
                  {q.lowerBound !== undefined && q.upperBound !== undefined && (
                    <div className="question-leader-bounds">
                      Guess: {formatBounds(q.lowerBound, q.upperBound)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="question-leaders-empty">
              No question leaders yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

QuestionLeadersSlide.displayName = 'QuestionLeadersSlide';
