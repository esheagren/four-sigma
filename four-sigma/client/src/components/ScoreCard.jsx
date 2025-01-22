import PropTypes from 'prop-types';

function ScoreCard({ score, totalQuestions, answeredQuestions }) {
  return (
    <div className="score-card">
      <h2>Game Complete!</h2>
      
      <div className="final-score">
        <div className="score-summary">
          <h3>Final Score: {score} out of {totalQuestions}</h3>
          <p className="accuracy">Accuracy: {((score/totalQuestions) * 100).toFixed(1)}%</p>
        </div>
      </div>
      
      <div className="question-history">
        <h3>Question History</h3>
        {answeredQuestions.map((q, index) => (
          <div 
            key={index} 
            className={`question-result ${q.wasCorrect ? 'correct' : 'incorrect'}`}
          >
            <div className="question-header">
              <span className="question-number">Question {index + 1}</span>
              <span className={`result-badge ${q.wasCorrect ? 'correct' : 'incorrect'}`}>
                {q.wasCorrect ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            <p className="question-text">{q.question}</p>
            <div className="answer-details">
              <p className="correct-answer">Correct Answer: {q.answer.toLocaleString()}</p>
              <p className="user-guess">
                Your Interval: [{q.userLower.toLocaleString()} - {q.userUpper.toLocaleString()}]
              </p>
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