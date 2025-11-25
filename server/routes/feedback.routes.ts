import { Router, Request, Response } from 'express';
import { createFeedback } from '../database/feedback.js';

const router = Router();

/**
 * POST /api/feedback
 * Submit feedback (works for both authenticated and anonymous users)
 * Body: { feedbackText, pageUrl? }
 * Headers: User-Agent (captured automatically)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { feedbackText, pageUrl } = req.body;

    // Validate feedback text
    if (!feedbackText || typeof feedbackText !== 'string') {
      res.status(400).json({ error: 'Feedback text is required' });
      return;
    }

    const trimmedFeedback = feedbackText.trim();
    if (trimmedFeedback.length < 1) {
      res.status(400).json({ error: 'Feedback text cannot be empty' });
      return;
    }

    if (trimmedFeedback.length > 5000) {
      res.status(400).json({ error: 'Feedback text must be 5000 characters or less' });
      return;
    }

    // Get user ID if authenticated (can be null for anonymous)
    const userId = req.user?.userId || null;

    // Get user agent from headers
    const userAgent = req.headers['user-agent'] || null;

    const feedback = await createFeedback(
      userId,
      trimmedFeedback,
      userAgent || undefined,
      pageUrl || undefined
    );

    res.status(201).json({
      success: true,
      feedback: {
        id: feedback.id,
        createdAt: feedback.createdAt,
      },
    });
  } catch (err) {
    console.error('Submit feedback error:', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

export default router;
