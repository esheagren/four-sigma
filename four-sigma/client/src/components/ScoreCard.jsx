import PropTypes from 'prop-types';

function ScoreCard({ score, totalQuestions, answeredQuestions }) {
  const correctCount = answeredQuestions.filter(q => q.wasCorrect).length;
  const accuracyPercentage = answeredQuestions.length > 0 
    ? ((correctCount / answeredQuestions.length) * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="score-card">
      
      <div className="final-score">
        <div className="score-summary">
          <h3>Final Score: {score}</h3>
          <p className="accuracy">
            Accuracy: {accuracyPercentage}%
          </p>
        </div>
      </div>
      
      <div className="question-history">
        {answeredQuestions.map((q, index) => (
          <div 
            key={index} 
            className={`question-result ${q.wasCorrect ? 'correct' : 'incorrect'}`}
          >
            <div className="question-header">
              <div className="question-number">Question {index + 1}</div>
              <div className={`result-badge ${q.wasCorrect ? 'correct' : 'incorrect'}`}>
                {q.wasCorrect ? 'CORRECT' : 'INCORRECT'}
              </div>
            </div>
            <div className="question-text">{q.question}</div>
            <div className="answer-details">
              <div>Correct Answer: {q.answer.toLocaleString()}</div>
              <div>Your Interval: [{q.userLower.toLocaleString()} - {q.userUpper.toLocaleString()}]</div>
              <div>Score: {q.score}</div>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => window.location.reload()} 
        className="play-again-button"
      >
        Play Again
      </button>
    </div>
  );
}

ScoreCard.propTypes = {
  score: PropTypes.number.isRequired,
  totalQuestions: PropTypes.number.isRequired,
  answeredQuestions: PropTypes.arrayOf(
    PropTypes.shape({
      question: PropTypes.string.isRequired,
      answer: PropTypes.number.isRequired,
      userLower: PropTypes.number.isRequired,
      userUpper: PropTypes.number.isRequired,
      wasCorrect: PropTypes.bool.isRequired
    })
  ).isRequired
};

export default ScoreCard; 