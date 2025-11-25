import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession, addAnswer, isQuestionInSession } from '../_lib/session-storage';

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
    const { sessionId, questionId, lower, upper } = req.body;

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
    const session = await getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check question is part of session
    if (!session.questionIds.includes(questionId)) {
      return res.status(400).json({ error: 'Question not part of this session' });
    }

    // Store the answer
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
  } catch (error) {
    console.error('Error submitting answer:', error);
    return res.status(500).json({ error: 'Failed to submit answer' });
  }
}
