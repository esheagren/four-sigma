import { Router, Request, Response } from 'express';
import { requireUser } from '../middleware/auth.js';
import { getUserById, getUserStats, updateUserProfile } from '../database/users.js';
import { getDailyStats, getPerformanceHistory } from '../database/sessions.js';

const router = Router();

/**
 * GET /api/user/profile
 * Get current user's profile with stats
 */
router.get('/profile', requireUser, async (req: Request, res: Response) => {
  try {
    const stats = await getUserStats(req.user!.userId);

    if (!stats) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
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
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * PATCH /api/user/profile
 * Update user profile (display name, timezone)
 * Body: { displayName?, timezone? }
 */
router.patch('/profile', requireUser, async (req: Request, res: Response) => {
  try {
    const { displayName, timezone } = req.body;

    // Validate display name
    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.trim().length < 1) {
        res.status(400).json({ error: 'Display name must be at least 1 character' });
        return;
      }
      if (displayName.length > 50) {
        res.status(400).json({ error: 'Display name must be 50 characters or less' });
        return;
      }
    }

    const user = await updateUserProfile(req.user!.userId, {
      displayName: displayName?.trim(),
      timezone,
    });

    res.json({
      user: {
        id: user.id,
        displayName: user.displayName,
        timezone: user.timezone,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/user/stats
 * Get detailed user statistics
 */
router.get('/stats', requireUser, async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.user!.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
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
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

/**
 * GET /api/user/daily-stats
 * Get user's daily statistics including rank and community averages
 */
router.get('/daily-stats', requireUser, async (req: Request, res: Response) => {
  try {
    const dailyStats = await getDailyStats(req.user!.userId);
    res.json(dailyStats);
  } catch (err) {
    console.error('Get daily stats error:', err);
    res.status(500).json({ error: 'Failed to get daily stats' });
  }
});

/**
 * GET /api/user/performance-history
 * Get user's performance history for the chart
 * Query params: days (default 7)
 */
router.get('/performance-history', requireUser, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const maxDays = 30; // Cap at 30 days
    const history = await getPerformanceHistory(req.user!.userId, Math.min(days, maxDays));
    res.json({ history });
  } catch (err) {
    console.error('Get performance history error:', err);
    res.status(500).json({ error: 'Failed to get performance history' });
  }
});

export default router;
