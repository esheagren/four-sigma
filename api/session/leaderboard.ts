import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for specific leaderboard type
    const { type } = req.query;

    if (type === 'overall') {
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, total_score, games_played, average_score')
        .gt('games_played', 0)
        .order('total_score', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Failed to fetch overall leaderboard:', error);
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
        console.error('Failed to fetch best guesses leaderboard:', error);
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

    // Default: session-based leaderboard (return empty for now since sessions are ephemeral)
    return res.json({ leaderboard: [] });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}
