import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser } from '../_lib/auth';
import { getDailyStats } from '../_lib/sessions';

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
    const dailyStats = await getDailyStats(authUser.userId);
    return res.json(dailyStats);
  } catch (err) {
    console.error('Get daily stats error:', err);
    return res.status(500).json({ error: 'Failed to get daily stats' });
  }
}
