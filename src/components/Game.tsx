import { useState, useEffect, useRef } from 'react';
import { QuestionCard } from './QuestionCard';
import { Results } from './Results';
import { getDeviceId } from '../lib/device';
import { useAuth } from '../context/AuthContext';
import { useAnimation } from '../context/AnimationContext';

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

interface DailyStats {
  dailyRank: number | null;
  topScoreToday: number | null;
  todaysAverage: number | null;
  userScoreToday: number | null;
  calibrationToday: number | null;
  totalParticipantsToday: number;
}

interface PerformanceHistoryEntry {
  date: string;
  day: string;
  userScore: number;
  avgScore: number;
  calibration: number;
}

interface FinalizeResponse {
  judgements: Judgement[];
  score: number;
  totalQuestions: number;
  dailyStats?: DailyStats;
  performanceHistory?: PerformanceHistoryEntry[];
}

export function Game() {
  const { authToken } = useAuth();
  const { animationPhase, triggerRevealAnimation } = useAnimation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<FinalizeResponse | null>(null);

  // Compute render states based on animation phase
  const isFadingOut = animationPhase === 'fadeOut';
  const isIntensifying = animationPhase === 'intensify' || animationPhase === 'converge';
  const isRevealing = animationPhase === 'reveal';
  const showQuestionCard = !results && (animationPhase === 'idle' || isFadingOut);
  const showResults = results && ['reveal', 'calm', 'idle'].includes(animationPhase);

  // Helper to get auth headers
  const getHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Device-Id': getDeviceId(),
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  };

  const startSession = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setCurrentQuestionIndex(0);

    try {
      const response = await fetch('/api/session/start', {
        method: 'POST',
        headers: getHeaders(),
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
        headers: getHeaders(),
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
        // FINAL QUESTION - trigger dramatic reveal animation
        // Run animation and API call in parallel, wait for both
        await Promise.all([
          triggerRevealAnimation(),
          finalizeSession(),
        ]);
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
        headers: getHeaders(),
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

  // Extract daily stats from response (when available)
  const dailyStats = results?.dailyStats;
  const performanceHistory = results?.performanceHistory;

  // Calculate calibration from this session's judgements
  const sessionCalibration = results && results.judgements.length > 0
    ? (results.judgements.filter(j => j.hit).length / results.judgements.length) * 100
    : undefined;

  // Use today's calibration from dailyStats if available, otherwise use session calibration
  const calibration = dailyStats?.calibrationToday ?? sessionCalibration;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="game-container">
      {/* Question Card with fade-out animation */}
      {showQuestionCard && currentQuestion && (
        <div className={`question-card-wrapper ${isFadingOut ? 'fading-out' : ''}`}>
          <QuestionCard
            question={currentQuestion}
            onSubmit={handleSubmitAnswer}
          />
        </div>
      )}

      {/* Results with reveal animation */}
      {showResults && results && (
        <div className={`results-wrapper ${isRevealing ? 'revealing' : ''}`}>
          <Results
            judgements={results.judgements}
            score={results.score}
            onRestart={startSession}
            dailyRank={dailyStats?.dailyRank ?? undefined}
            topScoreGlobal={dailyStats?.topScoreToday ?? undefined}
            dailyAverageScore={dailyStats?.todaysAverage ?? undefined}
            calibration={calibration}
            performanceHistory={performanceHistory}
            totalParticipants={dailyStats?.totalParticipantsToday ?? undefined}
          />
        </div>
      )}
    </div>
  );
}

