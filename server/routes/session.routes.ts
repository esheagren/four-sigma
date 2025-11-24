import { Router, Request, Response } from 'express';
import { getQuestionsForSession, getQuestionById } from '../database/questions.js';
import {
  generateSessionId,
  createSession,
  getSession,
  addAnswer,
  isQuestionInSession,
  recordQuestionScore,
  getQuestionStats,
  addToLeaderboard,
  getLeaderboard,
} from '../database/storage.js';
import {
  recordUserResponse,
  updateUserStatsAfterSession,
  getDailyStats,
  getPerformanceHistory,
} from '../database/sessions.js';
import {
  Answer,
  Judgement,
  StartSessionResponse,
  SubmitAnswerRequest,
  FinalizeSessionRequest,
  FinalizeSessionResponse,
} from '../types/index.js';
import { Score } from '../utils/scoring.js';

const router = Router();

/**
 * POST /api/session/start
 * Creates a new game session with three questions
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const sessionId = generateSessionId();

    // Get questions for this session from Supabase
    const selectedQuestions = await getQuestionsForSession(3);

    if (selectedQuestions.length === 0) {
      return res.status(500).json({ error: 'No questions available' });
    }

    const questionIds = selectedQuestions.map(q => q.id);

    // Create session
    createSession(sessionId, questionIds);

    // Return question stubs without true values
    const questionStubs = selectedQuestions.map(q => ({
      id: q.id,
      prompt: q.prompt,
      unit: q.unit,
    }));

    const response: StartSessionResponse = {
      sessionId,
      questions: questionStubs,
    };

    res.json(response);
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

/**
 * POST /api/answer
 * Submits an answer for a question in a session
 */
router.post('/answer', (req: Request, res: Response) => {
  const { sessionId, questionId, lower, upper } = req.body as SubmitAnswerRequest;
  
  // Validation
  if (!sessionId || !questionId) {
    return res.status(400).json({ error: 'Missing sessionId or questionId' });
  }
  
  if (typeof lower !== 'number' || typeof upper !== 'number') {
    return res.status(400).json({ error: 'Lower and upper must be numbers' });
  }
  
  if (lower > upper) {
    return res.status(400).json({ error: 'Lower bound cannot be greater than upper bound' });
  }
  
  // Check session exists
  const session = getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Check question is part of session
  if (!isQuestionInSession(sessionId, questionId)) {
    return res.status(400).json({ error: 'Question not part of this session' });
  }
  
  // Store the answer
  const answer: Answer = {
    questionId,
    lower,
    upper,
    submittedAt: new Date(),
  };
  
  addAnswer(sessionId, answer);
  
  res.json({ success: true });
});

/**
 * POST /api/session/finalize
 * Finalizes a session and returns judgements with scores
 */
router.post('/finalize', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body as FinalizeSessionRequest;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get user ID from request (set by auth middleware)
    const userId = req.user?.userId;

    // Compute judgements for each question
    const judgements: Judgement[] = [];
    let questionsCaptured = 0;

    for (const questionId of session.questionIds) {
      const question = await getQuestionById(questionId);
      const answer = session.answers.find(a => a.questionId === questionId);

      if (!question || !answer) {
        throw new Error(`Missing question or answer for ${questionId}`);
      }

      // A hit is when trueValue is within [lower, upper] inclusive
      const hit = Score.inBounds(answer.lower, answer.upper, question.trueValue);
      if (hit) questionsCaptured++;

      // Calculate individual score using the scoring algorithm
      const individualScore = Score.calculateScore(answer.lower, answer.upper, question.trueValue);

      // Record this score for community statistics (in-memory)
      recordQuestionScore(questionId, individualScore);

      // Persist to database if user is authenticated
      if (userId) {
        try {
          await recordUserResponse(userId, questionId, {
            lowerBound: answer.lower,
            upperBound: answer.upper,
            score: individualScore,
            captured: hit,
            answerValueAtResponse: question.trueValue,
          });
        } catch (dbError) {
          console.error('Failed to persist user response:', dbError);
          // Continue even if persistence fails
        }
      }

      // Get community stats for this question
      const communityStats = getQuestionStats(questionId);

      judgements.push({
        questionId: question.id,
        prompt: question.prompt,
        unit: question.unit,
        lower: answer.lower,
        upper: answer.upper,
        trueValue: question.trueValue,
        hit,
        score: individualScore,
        source: question.source,
        sourceUrl: question.sourceUrl,
        communityStats: communityStats || undefined,
      });
    }

    // Calculate total score
    const score = Score.calculateTotalScore(judgements.map(j => j.score));

    // Add to leaderboard (in-memory)
    addToLeaderboard(sessionId, score);

    // Update user stats and get daily stats if user is authenticated
    let dailyStats = undefined;
    let performanceHistory = undefined;

    if (userId) {
      try {
        // Update aggregate user stats
        await updateUserStatsAfterSession(userId, {
          sessionScore: score,
          questionsCaptured,
          questionsAnswered: judgements.length,
        });

        // Fetch daily stats and performance history
        const [daily, history] = await Promise.all([
          getDailyStats(userId),
          getPerformanceHistory(userId, 7),
        ]);

        dailyStats = daily;
        performanceHistory = history;
      } catch (statsError) {
        console.error('Failed to update/fetch user stats:', statsError);
        // Continue even if stats fail
      }
    }

    const response: FinalizeSessionResponse = {
      judgements,
      score,
      totalQuestions: judgements.length,
      dailyStats,
      performanceHistory,
    };

    res.json(response);
  } catch (error) {
    console.error('Error finalizing session:', error);
    res.status(500).json({ error: 'Failed to finalize session' });
  }
});

/**
 * GET /api/session/leaderboard
 * Get top scores from the leaderboard
 */
router.get('/leaderboard', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const leaderboard = getLeaderboard(Math.min(limit, 50)); // Cap at 50
  
  res.json({ leaderboard });
});

export default router;


