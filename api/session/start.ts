import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getQuestionsForSession } from '../_lib/questions';
import { generateSessionId, createSession } from '../_lib/session-storage';

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
    const sessionId = generateSessionId();

    // Get questions for this session from Supabase
    const selectedQuestions = await getQuestionsForSession(3);

    if (selectedQuestions.length === 0) {
      return res.status(500).json({ error: 'No questions available' });
    }

    const questionIds = selectedQuestions.map(q => q.id);

    // Create session (try to persist to Supabase)
    await createSession(sessionId, questionIds);

    // Return question stubs without true values
    const questionStubs = selectedQuestions.map(q => ({
      id: q.id,
      prompt: q.prompt,
      unit: q.unit,
    }));

    return res.json({
      sessionId,
      questions: questionStubs,
    });
  } catch (error) {
    console.error('Error starting session:', error);
    return res.status(500).json({ error: 'Failed to start session' });
  }
}
