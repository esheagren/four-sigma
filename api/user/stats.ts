import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser, getUserById } from '../_lib/auth';

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

  const authUser = await getAuthUser(req);

  if (!authUser) {
    return res.status(401).json({ error: 'User identification required. Send X-Device-Id header or Bearer token.' });
  }

  try {
    const user = await getUserById(authUser.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      stats: {
        totalScore: user.totalScore,
        averageScore: user.averageScore,
        gamesPlayed: user.gamesPlayed,
        questionsCaptured: user.questionsCaptured,
        calibrationRate: user.calibrationRate,
        currentStreak: user.currentStreak,
        bestStreak: user.bestStreak,
        bestSingleScore: user.bestSingleScore,
        weeklyScore: user.weeklyScore,
      },
    });
  } catch (err) {
    console.error('Get stats error:', err);
    return res.status(500).json({ error: 'Failed to get stats' });
  }
}
