import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/supabase.js';
import { getAuthUser } from './_lib/auth.js';
import { getQuestionsForSession, getQuestionById } from './_lib/questions.js';
import {
  generateSessionId,
  createSession,
  getSession,
  addAnswer,
  recordQuestionScore,
  getQuestionStats,
} from './_lib/session-storage.js';
import { recordUserResponse, updateUserStatsAfterSession, getDailyStats, getPerformanceHistory } from './_lib/sessions.js';
import { Score } from './_lib/scoring.js';
import { Judgement } from './_lib/types.js';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-Id');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url?.split('?')[0] || '';
  const action = path.replace('/api/session', '').replace('/', '');

  try {
    switch (action) {
      case 'start':
        return handleStart(req, res);
      case 'answer':
        return handleAnswer(req, res);
      case 'finalize':
        return handleFinalize(req, res);
      case 'leaderboard':
        return handleLeaderboard(req, res);
      default:
        return res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    console.error('Session error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleStart(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionId = generateSessionId();
  const selectedQuestions = await getQuestionsForSession(3);

  if (selectedQuestions.length === 0) {
    return res.status(500).json({ error: 'No questions available' });
  }

  const questionIds = selectedQuestions.map(q => q.id);
  await createSession(sessionId, questionIds);

  const questionStubs = selectedQuestions.map(q => ({
    id: q.id,
    prompt: q.prompt,
    unit: q.unit,
  }));

  return res.json({ sessionId, questions: questionStubs });
}

async function handleAnswer(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, questionId, lower, upper } = req.body;

  if (!sessionId || !questionId) {
    return res.status(400).json({ error: 'Missing sessionId or questionId' });
  }
  if (typeof lower !== 'number' || typeof upper !== 'number') {
    return res.status(400).json({ error: 'Lower and upper must be numbers' });
  }
  if (lower > upper) {
    return res.status(400).json({ error: 'Lower bound cannot be greater than upper bound' });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  if (!session.questionIds.includes(questionId)) {
    return res.status(400).json({ error: 'Question not part of this session' });
  }

  const success = await addAnswer(sessionId, {
    questionId,
    lower,
    upper,
    submittedAt: new Date(),
  });

  if (!success) {
    return res.status(500).json({ error: 'Failed to save answer' });
  }

  return res.json({ success: true });
}

async function handleFinalize(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const authUser = await getAuthUser(req);
  const userId = authUser?.userId;

  const judgements: Judgement[] = [];
  let questionsCaptured = 0;

  for (const questionId of session.questionIds) {
    const question = await getQuestionById(questionId);
    const answer = session.answers.find(a => a.questionId === questionId);

    if (!question || !answer) {
      throw new Error(`Missing question or answer for ${questionId}`);
    }

    const hit = Score.inBounds(answer.lower, answer.upper, question.trueValue);
    if (hit) questionsCaptured++;

    const individualScore = Score.calculateScore(answer.lower, answer.upper, question.trueValue);
    recordQuestionScore(questionId, individualScore);

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
      }
    }

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

  const score = Score.calculateTotalScore(judgements.map(j => j.score));

  let dailyStats = undefined;
  let performanceHistory = undefined;

  if (userId) {
    try {
      await updateUserStatsAfterSession(userId, {
        sessionScore: score,
        questionsCaptured,
        questionsAnswered: judgements.length,
      });

      const [daily, history] = await Promise.all([
        getDailyStats(userId),
        getPerformanceHistory(userId, 7),
      ]);

      dailyStats = daily;
      performanceHistory = history;
    } catch (statsError) {
      console.error('Failed to update/fetch user stats:', statsError);
    }
  }

  return res.json({
    judgements,
    score,
    totalQuestions: judgements.length,
    dailyStats,
    performanceHistory,
  });
}

async function handleLeaderboard(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type } = req.query;

  if (type === 'overall') {
    const { data, error } = await supabase
      .from('users')
      .select('id, display_name, total_score, games_played, average_score')
      .gt('games_played', 0)
      .order('total_score', { ascending: false })
      .limit(10);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }

    const leaderboard = (data || []).map((user, index) => ({
      rank: index + 1,
      displayName: user.display_name,
      totalScore: Math.round(Number(user.total_score)),
      gamesPlayed: user.games_played,
      averageScore: Number(user.average_score).toFixed(1),
    }));

    return res.json({ leaderboard });
  }

  if (type === 'best-guesses') {
    const { data, error } = await supabase
      .from('user_responses')
      .select(`
        score,
        lower_bound,
        upper_bound,
        answer_value_at_response,
        answered_at,
        users!fk_user_responses_user(display_name),
        questions!inner(question_text)
      `)
      .order('score', { ascending: false })
      .limit(10);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }

    const leaderboard = (data || []).map((entry: any, index: number) => ({
      rank: index + 1,
      displayName: entry.users?.display_name || 'Anonymous',
      score: Math.round(Number(entry.score)),
      questionText: entry.questions?.question_text || 'Unknown question',
      lowerBound: Number(entry.lower_bound),
      upperBound: Number(entry.upper_bound),
      trueValue: Number(entry.answer_value_at_response),
      answeredAt: entry.answered_at,
    }));

    return res.json({ leaderboard });
  }

  return res.json({ leaderboard: [] });
}
