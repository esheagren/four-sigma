import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractDeviceId } from '../_lib/auth';
import { getOrCreateDeviceUser } from '../_lib/users';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
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
    const deviceId = extractDeviceId(req);

    if (!deviceId) {
      return res.status(400).json({ error: 'X-Device-Id header required' });
    }

    const user = await getOrCreateDeviceUser(deviceId);

    return res.json({
      user: {
        id: user.id,
        displayName: user.displayName,
        isAnonymous: user.isAnonymous,
        totalScore: user.totalScore,
        averageScore: user.averageScore,
        gamesPlayed: user.gamesPlayed,
        currentStreak: user.currentStreak,
        bestStreak: user.bestStreak,
        calibrationRate: user.calibrationRate,
        questionsCaptured: user.questionsCaptured,
        bestSingleScore: user.bestSingleScore,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Device auth error:', err);
    return res.status(500).json({ error: 'Failed to initialize user' });
  }
}
