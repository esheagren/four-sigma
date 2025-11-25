import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser } from '../_lib/auth';
import { getPerformanceHistory } from '../_lib/sessions';

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
    const days = parseInt(req.query.days as string) || 7;
    const maxDays = 30;
    const history = await getPerformanceHistory(authUser.userId, Math.min(days, maxDays));
    return res.json({ history });
  } catch (err) {
    console.error('Get performance history error:', err);
    return res.status(500).json({ error: 'Failed to get performance history' });
  }
}
