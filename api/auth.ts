import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/supabase.js';
import { extractDeviceId, getAuthUser, getUserByAuthId, getUserByDeviceId, getUserById } from './_lib/auth.js';
import {
  getOrCreateDeviceUser,
  getUserByEmail,
  getUserByUsername,
  convertToAuthenticatedUser,
  createAuthenticatedUser,
  mergeUsers,
  linkDeviceToUser,
  isValidUsername,
  isUsernameAvailable,
  generateUsernameSuggestions,
  setUsernameForDevice,
  linkEmailToUser,
} from './_lib/users.js';
import { User } from './_lib/types.js';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-Id');
}

// Helper to format user response (consistent shape across all endpoints)
function formatUserResponse(user: User) {
  return {
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
  };
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
      case 'check-username':
        return handleCheckUsername(req, res);
      case 'set-username':
        return handleSetUsername(req, res);
      case 'signup':
        return handleSignup(req, res);
      case 'login':
        return handleLogin(req, res);
      case 'link-email':
        return handleLinkEmail(req, res);
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

/**
 * POST /api/auth/device
 * Get or create an anonymous device user
 */
async function handleDevice(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const deviceId = extractDeviceId(req);
  if (!deviceId) {
    return res.status(400).json({ error: 'X-Device-Id header required' });
  }

  const user = await getOrCreateDeviceUser(deviceId);
  return res.json({ user: formatUserResponse(user) });
}

/**
 * POST /api/auth/check-username
 * Check if a username is available
 * Body: { username: string }
 * Returns: { available: boolean, suggestions?: string[] }
 */
async function handleCheckUsername(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  // Validate format first
  if (!isValidUsername(username)) {
    return res.status(400).json({
      error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores',
      available: false,
    });
  }

  const available = await isUsernameAvailable(username);

  if (available) {
    return res.json({ available: true });
  }

  // Generate suggestions if username is taken
  const suggestions = generateUsernameSuggestions(username);
  return res.json({ available: false, suggestions });
}

/**
 * POST /api/auth/set-username
 * Set username for a device user (username-only signup)
 * Body: { username: string }
 * Returns: { user: User }
 */
async function handleSetUsername(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const deviceId = extractDeviceId(req);
  if (!deviceId) {
    return res.status(400).json({ error: 'X-Device-Id header required' });
  }

  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  // Validate format
  if (!isValidUsername(username)) {
    return res.status(400).json({
      error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores',
    });
  }

  // Check availability
  const available = await isUsernameAvailable(username);
  if (!available) {
    const suggestions = generateUsernameSuggestions(username);
    return res.status(409).json({
      error: 'Username is already taken',
      suggestions,
    });
  }

  // Set the username
  const user = await setUsernameForDevice(deviceId, username);

  return res.status(201).json({ user: formatUserResponse(user) });
}

/**
 * POST /api/auth/signup
 * Full signup with email + password + username
 * Body: { email: string, password: string, username: string }
 */
async function handleSignup(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, username } = req.body;
  const deviceId = extractDeviceId(req);

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required' });
  }

  // Validate username format
  if (!isValidUsername(username)) {
    return res.status(400).json({
      error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores',
    });
  }

  // Check if email is already registered
  const existingEmailUser = await getUserByEmail(email);
  if (existingEmailUser) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  // Check if username is available
  const usernameAvailable = await isUsernameAvailable(username);
  if (!usernameAvailable) {
    const suggestions = generateUsernameSuggestions(username);
    return res.status(409).json({ error: 'Username is already taken', suggestions });
  }

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError || !authData.user) {
    return res.status(400).json({ error: authError?.message || 'Failed to create account' });
  }

  const authId = authData.user.id;
  let user;

  // If device user exists, convert them to authenticated
  if (deviceId) {
    const anonymousUser = await getUserByDeviceId(deviceId);
    if (anonymousUser && anonymousUser.isAnonymous) {
      user = await convertToAuthenticatedUser(anonymousUser.id, authId, email, username);
    }
  }

  // Otherwise create a new authenticated user
  if (!user) {
    user = await createAuthenticatedUser(authId, email, username, deviceId || undefined);
  }

  return res.status(201).json({
    user: formatUserResponse(user),
    session: authData.session,
  });
}

/**
 * POST /api/auth/login
 * Login with email + password
 * Body: { email: string, password: string }
 */
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

  // Edge case: auth exists but no user record (shouldn't happen normally)
  if (!user) {
    user = await createAuthenticatedUser(authData.user.id, email, email.split('@')[0], deviceId || undefined);
  }

  // Handle merging anonymous device user if exists
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
    user: user ? formatUserResponse(user) : null,
    session: authData.session,
  });
}

/**
 * POST /api/auth/link-email
 * Link email to a username-only account (upgrade account)
 * Body: { email: string, password: string }
 */
async function handleLinkEmail(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const deviceId = extractDeviceId(req);
  if (!deviceId) {
    return res.status(400).json({ error: 'X-Device-Id header required' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Get current user by device
  const currentUser = await getUserByDeviceId(deviceId);
  if (!currentUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Make sure they're a username-only user (not anonymous, but no email yet)
  if (currentUser.isAnonymous) {
    return res.status(400).json({ error: 'Please set a username first' });
  }

  if (currentUser.email) {
    return res.status(400).json({ error: 'Account already has an email linked' });
  }

  // Check if email is already in use
  const existingEmailUser = await getUserByEmail(email);
  if (existingEmailUser) {
    return res.status(409).json({ error: 'Email already registered to another account' });
  }

  // Create Supabase auth account
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError || !authData.user) {
    return res.status(400).json({ error: authError?.message || 'Failed to create auth account' });
  }

  // Link the email to the user
  const user = await linkEmailToUser(currentUser.id, authData.user.id, email);

  return res.json({
    user: formatUserResponse(user),
    session: authData.session,
  });
}

/**
 * POST /api/auth/logout
 */
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

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
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

  return res.json({ user: formatUserResponse(user) });
}
