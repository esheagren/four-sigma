import { Router, Request, Response } from 'express';
import { supabase } from '../database/supabase.js';
import {
  getOrCreateDeviceUser,
  getUserByAuthId,
  getUserByDeviceId,
  getUserByEmail,
  convertToAuthenticatedUser,
  createAuthenticatedUser,
  mergeUsers,
  linkDeviceToUser,
} from '../database/users.js';
import { extractDeviceId } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/device
 * Initialize or retrieve anonymous user by device ID
 */
router.post('/device', async (req: Request, res: Response) => {
  try {
    const deviceId = extractDeviceId(req);

    if (!deviceId) {
      res.status(400).json({ error: 'X-Device-Id header required' });
      return;
    }

    const user = await getOrCreateDeviceUser(deviceId);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        isAnonymous: user.isAnonymous,
        emailVerified: user.emailVerified,
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
    res.status(500).json({ error: 'Failed to initialize user' });
  }
});

/**
 * POST /api/auth/signup
 * Create authenticated account, merging anonymous data if exists
 * Body: { email, password, username }
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;
    const deviceId = extractDeviceId(req);

    if (!email || !password || !username) {
      res.status(400).json({ error: 'Email, password, and username required' });
      return;
    }

    // Check if email already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      res.status(400).json({ error: authError?.message || 'Failed to create account' });
      return;
    }

    const authId = authData.user.id;

    // Check if there's an existing anonymous user with this device
    let user;
    if (deviceId) {
      const anonymousUser = await getUserByDeviceId(deviceId);
      if (anonymousUser && anonymousUser.isAnonymous) {
        // Convert the anonymous user to authenticated (keeps their data)
        user = await convertToAuthenticatedUser(anonymousUser.id, authId, email, username);
      }
    }

    // If no anonymous user to convert, create new authenticated user
    if (!user) {
      user = await createAuthenticatedUser(authId, email, username, deviceId || undefined);
    }

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isAnonymous: user.isAnonymous,
        emailVerified: user.emailVerified,
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
      session: authData.session,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

/**
 * POST /api/auth/login
 * Login to existing account, merge anonymous data if on new device
 * Body: { email, password }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const deviceId = extractDeviceId(req);

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Get our user record by auth ID
    let user = await getUserByAuthId(authData.user.id);

    if (!user) {
      // This shouldn't happen, but handle gracefully
      // Create user record if it doesn't exist
      user = await createAuthenticatedUser(
        authData.user.id,
        email,
        email.split('@')[0], // Default display name
        deviceId || undefined
      );
    }

    // Check if there's anonymous data on this device to merge
    if (deviceId) {
      const anonymousUser = await getUserByDeviceId(deviceId);
      if (anonymousUser && anonymousUser.isAnonymous && anonymousUser.id !== user.id) {
        // Merge anonymous user's data into authenticated user
        await mergeUsers(anonymousUser.id, user.id);
        // Refresh user data after merge
        user = await getUserByAuthId(authData.user.id);
      }

      // Link device to authenticated user
      if (user && user.deviceId !== deviceId) {
        await linkDeviceToUser(user.id, deviceId);
      }
    }

    res.json({
      user: user ? {
        id: user.id,
        email: user.email,
        username: user.username,
        isAnonymous: user.isAnonymous,
        emailVerified: user.emailVerified,
        totalScore: user.totalScore,
        averageScore: user.averageScore,
        gamesPlayed: user.gamesPlayed,
        currentStreak: user.currentStreak,
        bestStreak: user.bestStreak,
        calibrationRate: user.calibrationRate,
        questionsCaptured: user.questionsCaptured,
        bestSingleScore: user.bestSingleScore,
        createdAt: user.createdAt,
      } : null,
      session: authData.session,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * POST /api/auth/logout
 * Sign out user
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Sign out from Supabase
      await supabase.auth.signOut();
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Get full user data
    const { getUserById } = await import('../database/users.js');
    const user = await getUserById(req.user.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isAnonymous: user.isAnonymous,
        emailVerified: user.emailVerified,
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
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
