import { useState, useEffect, useRef } from 'react';
import { QuestionCard } from './QuestionCard';
import { Results } from '../results/Results';
import { LoadingOrb } from './LoadingOrb';
import { getDeviceId } from '../../lib/device';
import { useAuth } from '../../context/AuthContext';
import { useAnimation } from '../../context/AnimationContext';
import { useAnalytics } from '../../context/PostHogContext';

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

interface TodayLeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  isCurrentUser?: boolean;
}

interface OverallLeaderboardEntry {
  rank: number;
  displayName: string;
  totalScore: number;
  gamesPlayed: number;
  isCurrentUser?: boolean;
}

interface DailyStats {
  dailyRank: number | null;
  topScoreToday: number | null;
  todaysAverage: number | null;
  userScoreToday: number | null;
  calibrationToday: number | null;
  totalParticipantsToday: number;
  todayLeaderboard?: TodayLeaderboardEntry[];
}

interface PerformanceHistoryEntry {
  date: string;
  day: string;
  userScore: number;
  avgScore: number;
  calibration: number;
}

interface CalibrationMilestone {
  date: string;
  label: string;
  calibration: number;
}

interface OverallStanding {
  percentile: number;
  totalPlayers: number;
}

interface FinalizeResponse {
  judgements: Judgement[];
  score: number;
  totalQuestions: number;
  dailyStats?: DailyStats;
  performanceHistory?: PerformanceHistoryEntry[];
  calibrationMilestones?: CalibrationMilestone[];
  overallLeaderboard?: OverallLeaderboardEntry[];
  overallStanding?: OverallStanding;
}

export function Game() {
  const { authToken } = useAuth();
  const { animationPhase, triggerRevealAnimation } = useAnimation();
  const { capture } = useAnalytics();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<FinalizeResponse | null>(null);
  const [isFinalizingSession, setIsFinalizingSession] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track response time for each question
  const questionStartTime = useRef<number>(Date.now());

  // Compute render states based on animation phase
  const isFadingOut = animationPhase === 'fadeOut';
  const isRevealing = animationPhase === 'reveal';
  // Hide question card once we start finalizing (prevents flicker if API is slower than animation)
  const showQuestionCard = !results && !isFinalizingSession && (animationPhase === 'idle' || isFadingOut);
  // Single orb: show during animation phases AND after results exist (scroll controls position)
  const showOrb = results
    ? true  // Always show orb once we have results
    : ['showOrb', 'scoreReveal'].includes(animationPhase);
  const showScoreInOrb = animationPhase === 'scoreReveal' || (results && animationPhase === 'idle');
  const showResults = results && ['reveal', 'idle'].includes(animationPhase);

  // Handle scroll progress from Results carousel
  const handleResultsScroll = (progress: number) => {
    setScrollProgress(progress);
  };

  // Compute orb position/scale based on animation phase and scroll progress
  const getOrbStyle = () => {
    // During animation phases (not yet idle with results), orb is centered
    if (!results || animationPhase !== 'idle') {
      return {
        top: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
      };
    }
    // After reveal (idle with results), scroll controls position
    // Scale: 1.0 at progress=0, 0.25 at progress=1 (shrink more to get closer to card)
    const scale = 1 - (scrollProgress * 0.75);
    // Top: 50% (centered) at progress=0, 14% (below navbar) at progress=1
    const topPercent = 50 - (scrollProgress * 36);
    return {
      top: `${topPercent}%`,
      transform: `translateX(-50%) translateY(-50%) scale(${scale})`,
    };
  };

  const orbStyle = getOrbStyle();

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

      // Track session start
      capture('game_session_started', {
        sessionId: data.sessionId,
        questionCount: data.questions.length,
      });

      // Reset timer for first question
      questionStartTime.current = Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      capture('game_error', {
        error: 'session_start_failed',
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startSession();
  }, []);

  // Track question views when index changes
  useEffect(() => {
    if (sessionId && questions[currentQuestionIndex]) {
      capture('question_viewed', {
        sessionId,
        questionId: questions[currentQuestionIndex].id,
        questionIndex: currentQuestionIndex,
        totalQuestions: questions.length,
      });
      // Reset timer for new question
      questionStartTime.current = Date.now();
    }
  }, [currentQuestionIndex, sessionId, questions.length]);

  const handleSubmitAnswer = async (lower: number, upper: number) => {
    if (!sessionId || !questions[currentQuestionIndex]) return;

    const responseTimeMs = Date.now() - questionStartTime.current;
    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    // Track answer submission (fire-and-forget)
    capture('answer_submitted', {
      sessionId,
      questionId: currentQuestion.id,
      questionIndex: currentQuestionIndex,
      lowerBound: lower,
      upperBound: upper,
      intervalWidth: upper - lower,
      responseTimeMs,
      isLastQuestion,
    });

    // OPTIMISTIC UI: Advance to next question immediately, don't wait for API
    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // FINAL QUESTION - trigger dramatic reveal animation
      setIsFinalizingSession(true);
    }

    // Submit answer to API in background
    try {
      const response = await fetch('/api/session/answer', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          lower,
          upper,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Submit answer error:', response.status, errorData);
        // Don't throw - we've already advanced the UI
        // The answer will be missing at finalize time, which is handled gracefully
      }
    } catch (err) {
      console.error('Submit answer exception:', err);
      // Don't set error state - allow user to continue playing
      // Missing answers will be handled at finalize
      capture('game_error', {
        error: 'answer_submit_failed',
        sessionId,
        questionIndex: currentQuestionIndex,
      });
    }

    // For last question, run animation and finalize in parallel
    if (isLastQuestion) {
      await Promise.all([
        triggerRevealAnimation(),
        finalizeSession(),
      ]);
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

      const data: FinalizeResponse = await response.json();
      setResults(data);

      // Track session completion with rich context
      const hits = data.judgements.filter((j: Judgement) => j.hit).length;
      const calibration = data.judgements.length > 0
        ? (hits / data.judgements.length) * 100
        : 0;

      capture('game_session_completed', {
        sessionId,
        totalScore: data.score,
        hits,
        misses: data.totalQuestions - hits,
        totalQuestions: data.totalQuestions,
        calibration,
        dailyRank: data.dailyStats?.dailyRank ?? null,
        topScoreToday: data.dailyStats?.topScoreToday ?? null,
        totalParticipantsToday: data.dailyStats?.totalParticipantsToday ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      capture('game_error', {
        error: 'finalize_failed',
        sessionId,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="game-container">
        <LoadingOrb />
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
  const calibrationMilestones = results?.calibrationMilestones;
  const overallLeaderboard = results?.overallLeaderboard;
  const overallStanding = results?.overallStanding;

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
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={questions.length}
          />
        </div>
      )}

      {/* Single orb - positioned based on animation phase and scroll progress */}
      {showOrb && (
        <div className="game-orb-container" style={orbStyle}>
          <LoadingOrb
            score={results?.score}
            showScore={showScoreInOrb}
            animateScore={animationPhase === 'scoreReveal'}
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
            calibrationMilestones={calibrationMilestones}
            totalParticipants={dailyStats?.totalParticipantsToday ?? undefined}
            todayLeaderboard={dailyStats?.todayLeaderboard}
            overallLeaderboard={overallLeaderboard}
            overallStanding={overallStanding}
            onScroll={handleResultsScroll}
          />
        </div>
      )}
    </div>
  );
}

