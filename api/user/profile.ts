import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUser } from '../_lib/auth';
import { getUserStats, updateUserProfile } from '../_lib/users';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authUser = await getAuthUser(req);

  if (!authUser) {
    return res.status(401).json({ error: 'User identification required. Send X-Device-Id header or Bearer token.' });
  }

  if (req.method === 'GET') {
    try {
      const stats = await getUserStats(authUser.userId);

      if (!stats) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({
        user: {
          id: stats.user.id,
          email: stats.user.email,
          displayName: stats.user.displayName,
          isAnonymous: stats.user.isAnonymous,
          createdAt: stats.user.createdAt,
          lastPlayedAt: stats.user.lastPlayedAt,
        },
        stats: {
          totalScore: stats.user.totalScore,
          averageScore: stats.user.averageScore,
          gamesPlayed: stats.user.gamesPlayed,
          questionsCaptured: stats.user.questionsCaptured,
          calibrationRate: stats.user.calibrationRate,
          currentStreak: stats.user.currentStreak,
          bestStreak: stats.user.bestStreak,
          bestSingleScore: stats.user.bestSingleScore,
          weeklyScore: stats.user.weeklyScore,
        },
        recentGames: stats.recentGames.map((game: any) => ({
          id: game.id,
          score: Number(game.score),
          captured: game.captured,
          answeredAt: game.answered_at,
          questionText: game.question?.question_text,
        })),
        categoryStats: stats.categoryStats.map((cat: any) => ({
          subcategoryName: cat.subcategory?.name,
          categoryName: cat.subcategory?.category?.name,
          domainName: cat.subcategory?.category?.domain?.name,
          questionsAnswered: cat.questions_answered,
          totalScore: Number(cat.total_score),
          averageScore: Number(cat.average_score),
          calibrationRate: Number(cat.calibration_rate),
        })),
      });
    } catch (err) {
      console.error('Get profile error:', err);
      return res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { displayName, timezone } = req.body;

      // Validate display name
      if (displayName !== undefined) {
        if (typeof displayName !== 'string' || displayName.trim().length < 1) {
          return res.status(400).json({ error: 'Display name must be at least 1 character' });
        }
        if (displayName.length > 50) {
          return res.status(400).json({ error: 'Display name must be 50 characters or less' });
        }
      }

      const user = await updateUserProfile(authUser.userId, {
        displayName: displayName?.trim(),
        timezone,
      });

      return res.json({
        user: {
          id: user.id,
          displayName: user.displayName,
          timezone: user.timezone,
        },
      });
    } catch (err) {
      console.error('Update profile error:', err);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
