import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/supabase.js';
import { extractDeviceId, getAuthUser, getUserByAuthId, getUserByDeviceId, getUserById } from './_lib/auth.js';
import {
  getOrCreateDeviceUser,
  getUserByEmail,
  convertToAuthenticatedUser,
  createAuthenticatedUser,
  mergeUsers,
  linkDeviceToUser,
} from './_lib/users.js';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-Id');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Route based on the path: /api/auth/device, /api/auth/signup, etc.
  const path = req.url?.split('?')[0] || '';
  const action = path.replace('/api/auth', '').replace('/', '');

  try {
    switch (action) {
      case 'device':
        return handleDevice(req, res);
      case 'signup':
        return handleSignup(req, res);
      case 'login':
        return handleLogin(req, res);
      case 'logout':
        return handleLogout(req, res);
      case 'me':
        return handleMe(req, res);
      default:
        return res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDevice(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}

async function handleSignup(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, displayName } = req.body;
  const deviceId = extractDeviceId(req);

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'Email, password, and display name required' });
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError || !authData.user) {
    return res.status(400).json({ error: authError?.message || 'Failed to create account' });
  }

  const authId = authData.user.id;
  let user;

  if (deviceId) {
    const anonymousUser = await getUserByDeviceId(deviceId);
    if (anonymousUser && anonymousUser.isAnonymous) {
      user = await convertToAuthenticatedUser(anonymousUser.id, authId, email, displayName);
    }
  }

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
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  const deviceId = extractDeviceId(req);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError || !authData.user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  let user = await getUserByAuthId(authData.user.id);

  if (!user) {
    user = await createAuthenticatedUser(authData.user.id, email, email.split('@')[0], deviceId || undefined);
  }

  if (deviceId) {
    const anonymousUser = await getUserByDeviceId(deviceId);
    if (anonymousUser && anonymousUser.isAnonymous && anonymousUser.id !== user.id) {
      await mergeUsers(anonymousUser.id, user.id);
      user = await getUserByAuthId(authData.user.id);
    }
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
}

async function handleLogout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    await supabase.auth.signOut();
  }

  return res.json({ success: true });
}

async function handleMe(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authUser = await getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await getUserById(authUser.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({
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
  });
}
