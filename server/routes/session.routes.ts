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
} from '../database/storage.js';
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
router.post('/start', (req: Request, res: Response) => {
  const sessionId = generateSessionId();
  
  // Get questions for this session
  const selectedQuestions = getQuestionsForSession(3);
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
router.post('/finalize', (req: Request, res: Response) => {
  const { sessionId } = req.body as FinalizeSessionRequest;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }
  
  const session = getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Compute judgements for each question
  const judgements: Judgement[] = session.questionIds.map(questionId => {
    const question = getQuestionById(questionId);
    const answer = session.answers.find(a => a.questionId === questionId);
    
    if (!question || !answer) {
      throw new Error(`Missing question or answer for ${questionId}`);
    }
    
    // A hit is when trueValue is within [lower, upper] inclusive
    const hit = Score.inBounds(answer.lower, answer.upper, question.trueValue);
    
    // Calculate individual score using the scoring algorithm
    const individualScore = Score.calculateScore(answer.lower, answer.upper, question.trueValue);
    
    // Record this score for community statistics
    recordQuestionScore(questionId, individualScore);
    
    // Get community stats for this question
    const communityStats = getQuestionStats(questionId);
    
    return {
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
    };
  });
  
  // Calculate total score
  const score = Score.calculateTotalScore(judgements.map(j => j.score));
  
  const response: FinalizeSessionResponse = {
    judgements,
    score,
    totalQuestions: judgements.length,
  };
  
  res.json(response);
});

export default router;


