import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser } from '../_lib/auth';
import { getQuestionById } from '../_lib/questions';
import { getSession, recordQuestionScore, getQuestionStats } from '../_lib/session-storage';
import { recordUserResponse, updateUserStatsAfterSession, getDailyStats, getPerformanceHistory } from '../_lib/sessions';
import { Score } from '../_lib/scoring';
import { Judgement } from '../_lib/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get user ID from request
    const authUser = await getAuthUser(req);
    const userId = authUser?.userId;

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

      // Calculate individual score
      const individualScore = Score.calculateScore(answer.lower, answer.upper, question.trueValue);

      // Record this score for community statistics
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

    // Update user stats and get daily stats if user is authenticated
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
  } catch (error) {
    console.error('Error finalizing session:', error);
    return res.status(500).json({ error: 'Failed to finalize session' });
  }
}
