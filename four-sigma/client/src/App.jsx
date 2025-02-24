import { useState, useEffect } from 'react';
import './styles/App.css'
import InputFields from './components/InputField'
import QuestionField from './components/QuestionField'
import SubmitButton from './components/SubmitButton'
import ScoreCard from './components/ScoreCard'
import HeaderBar from './components/HeaderBar'
import './styles/scoreCard.css'


function App() {
  
  const [lowerNumber, setLowerNumber] = useState('');
  const [upperNumber, setUpperNumber] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [totalQuestions] = useState(2); // Set how many questions per game
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);

  // Fetch question when component mounts
  useEffect(() => {
    console.log('Fetching new question');
    fetchNewQuestion();
  }, []);

  const handleNumberChange = (type, newValue) => {
    if (type === 'lower') {
      setLowerNumber(newValue);
    } else {
      setUpperNumber(newValue);
    }
  };

  const fetchNewQuestion = async () => {
    try {
      const response = await fetch('/api/questions');
      const data = await response.json();
      console.log('New question data:', data);
      setCurrentQuestion(data);
      console.log('Current question:', currentQuestion);
      setError(null);
    } catch (error) {
      setError('Failed to fetch question');
    } 
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lowerBound: Number(lowerNumber),
          upperBound: Number(upperNumber),
          questionId: currentQuestion.questionId
        })
      });

      const result = await response.json();
      
      // Add current question to answered questions, adjusting score: if result.score === -1, show 0.
      setAnsweredQuestions(prev => [
        ...prev,
        {
          question: currentQuestion.text,
          answer: currentQuestion.answer,
          userLower: Number(lowerNumber),
          userUpper: Number(upperNumber),
          wasCorrect: result.correct,
          score: result.score < 0 ? 0 : result.score
        }
      ]);

      // Only update overall score if the answer was considered correct.
      if (result.correct) {
        setScore(prevScore => prevScore + result.score);
      }

      // Increment question count
      setQuestionCount(prev => prev + 1);

      // Check if game should end
      if (questionCount + 1 >= totalQuestions) {
        setIsGameComplete(true);
      } else {
        setLowerNumber('');
        setUpperNumber('');
        fetchNewQuestion();
      }

    } catch (error) {
      setError('Failed to submit answer');
    }
  };

  // Update the validation check to allow equal bounds
  const isValidBounds = () => {
    return lowerNumber && upperNumber && Number(lowerNumber) <= Number(upperNumber);
  };

  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <HeaderBar />
      <div className="app-container">
        {isGameComplete ? (
          <ScoreCard 
            score={score}
            totalQuestions={totalQuestions}
            answeredQuestions={answeredQuestions}
          />
        ) : (
          <>
            <p>Question {questionCount + 1} of {totalQuestions}</p>
            <QuestionField question={currentQuestion} />
            <InputFields
              lowerValue={lowerNumber}
              upperValue={upperNumber}
              onValueChange={handleNumberChange}
            />
            <SubmitButton 
              onClick={handleSubmit} 
              disabled={!isValidBounds()}
            />
          </>
        )}
      </div>
    </>
  );
}

export default App
