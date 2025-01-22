import { useState } from 'react';
import { useEffect } from 'react';
import './styles/App.css'
import InputFields from './components/InputField'
import QuestionField from './components/QuestionField'
import SubmitButton from './components/SubmitButton'
import ScoreCard from './components/ScoreCard'
import './styles/scoreCard.css'


function App() {
  
  const [lowerNumber, setLowerNumber] = useState();  // Initialize as empty string
  const [upperNumber, setUpperNumber] = useState();
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [totalQuestions] = useState(1); // Set how many questions per game
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
          questionId: currentQuestion.id
        })
      });

      const result = await response.json();
      
      // Add current question to answered questions
      setAnsweredQuestions(prev => [...prev, {
        question: currentQuestion.question,
        answer: currentQuestion.answer,
        userLower: Number(lowerNumber),
        userUpper: Number(upperNumber),
        wasCorrect: result.correct
      }]);

      // Update score
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

  // Add validation check
  const isValidBounds = () => {
    return lowerNumber && upperNumber && Number(lowerNumber) < Number(upperNumber);
  };

  if (error) return <div>Error: {error}</div>;

  return (
    <div className="app-container">
      <h1>4-σ</h1>
      
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
  );
}

export default App
