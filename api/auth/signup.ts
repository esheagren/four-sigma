import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { extractDeviceId, getUserByDeviceId } from '../_lib/auth';
import { getUserByEmail, convertToAuthenticatedUser, createAuthenticatedUser } from '../_lib/users';

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
    const { email, password, displayName } = req.body;
    const deviceId = extractDeviceId(req);

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and display name required' });
    }

    // Check if email already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(400).json({ error: authError?.message || 'Failed to create account' });
    }

    const authId = authData.user.id;

    // Check if there's an existing anonymous user with this device
    let user;
    if (deviceId) {
      const anonymousUser = await getUserByDeviceId(deviceId);
      if (anonymousUser && anonymousUser.isAnonymous) {
        // Convert the anonymous user to authenticated (keeps their data)
        user = await convertToAuthenticatedUser(anonymousUser.id, authId, email, displayName);
      }
    }

    // If no anonymous user to convert, create new authenticated user
    if (!user) {
      user = await createAuthenticatedUser(authId, email, displayName, deviceId || undefined);
    }

    return res.status(201).json({
      user: {
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
      },
      session: authData.session,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Failed to create account' });
  }
}
