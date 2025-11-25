import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { extractDeviceId, getUserByAuthId, getUserByDeviceId } from '../_lib/auth';
import { createAuthenticatedUser, mergeUsers, linkDeviceToUser } from '../_lib/users';

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
    const { email, password } = req.body;
    const deviceId = extractDeviceId(req);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get our user record by auth ID
    let user = await getUserByAuthId(authData.user.id);

    if (!user) {
      // Create user record if it doesn't exist
      user = await createAuthenticatedUser(
        authData.user.id,
        email,
        email.split('@')[0],
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

    return res.json({
      user: user ? {
        id: user.id,
        email: user.email,
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
      } : null,
      session: authData.session,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to login' });
  }
}
