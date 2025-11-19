import { useState, useEffect } from 'react';
import { QuestionCard } from './QuestionCard';
import { Results } from './Results';

interface Question {
  id: string;
  prompt: string;
  unit?: string;
}

interface Judgement {
  questionId: string;
  prompt: string;
  unit?: string;
  lower: number;
  upper: number;
  trueValue: number;
  hit: boolean;
  score: number;
  source?: string;
  sourceUrl?: string;
  communityStats?: {
    averageScore: number;
    highestScore: number;
  };
}

interface FinalizeResponse {
  judgements: Judgement[];
  score: number;
  totalQuestions: number;
}

export function Game() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<FinalizeResponse | null>(null);

  const startSession = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setCurrentQuestionIndex(0);
    
    try {
      const response = await fetch('/api/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to start session');
      }
      
      const data = await response.json();
      setSessionId(data.sessionId);
      setQuestions(data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startSession();
  }, []);

  const handleSubmitAnswer = async (lower: number, upper: number) => {
    if (!sessionId || !questions[currentQuestionIndex]) return;

    try {
      const response = await fetch('/api/session/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          questionId: questions[currentQuestionIndex].id,
          lower,
          upper,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Submit answer error:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to submit answer');
      }

      // Move to next question or finalize
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Finalize the session
        await finalizeSession();
      }
    } catch (err) {
      console.error('Submit answer exception:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const finalizeSession = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/session/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to finalize session');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="game-container">
        <div className="loading">Loading game...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-container">
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={startSession} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (results) {
    return (
      <div className="game-container">
        <Results
          judgements={results.judgements}
          score={results.score}
          onRestart={startSession}
        />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="game-container">
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          onSubmit={handleSubmitAnswer}
        />
      )}
    </div>
  );
}

