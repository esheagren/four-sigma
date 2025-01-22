import PropTypes from 'prop-types';

function QuestionField({ question }) {
    return (
      <div className="question-container">
        <h2>{question?.question || 'Loading...'}</h2>
      </div>
    );
}

QuestionField.propTypes = {
    question: PropTypes.shape({
        id: PropTypes.number,
        question: PropTypes.string,
        answer: PropTypes.number
    })
};

export default QuestionField; 





