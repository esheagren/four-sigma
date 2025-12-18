import { supabase } from './supabase.js';
import { User } from '../types/index.js';

// Helper to convert database row to User type
function rowToUser(row: any): User {
  return {
    id: row.id,
    deviceId: row.device_id,
    authId: row.auth_id,
    email: row.email,
    displayName: row.username,
    isAnonymous: row.is_anonymous,
    createdAt: new Date(row.created_at),
    lastPlayedAt: row.last_played_at ? new Date(row.last_played_at) : null,
    timezone: row.timezone,
    totalScore: Number(row.total_score),
    averageScore: Number(row.average_score),
    weeklyScore: Number(row.weekly_score),
    gamesPlayed: row.games_played,
    questionsCaptured: row.questions_captured,
    calibrationRate: Number(row.calibration_rate),
    currentStreak: row.current_streak,
    bestStreak: row.best_streak,
    bestSingleScore: Number(row.best_single_score),
  };
}

/**
 * Get or create an anonymous user by device ID
 */
export async function getOrCreateDeviceUser(deviceId: string): Promise<User> {
  // First try to find existing user with this device ID
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('device_id', deviceId)
    .single();

  if (existingUser && !findError) {
    return rowToUser(existingUser);
  }

  // Create new anonymous user
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      device_id: deviceId,
      username: 'Guest Player',
      is_anonymous: true,
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create user: ${createError.message}`);
  }

  return rowToUser(newUser);
}

/**
 * Get user by Supabase auth ID
 */
export async function getUserByAuthId(authId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .single();

  if (error || !data) {
    return null;
  }

  return rowToUser(data);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    return null;
  }

  return rowToUser(data);
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return rowToUser(data);
}

/**
 * Get user by device ID
 */
export async function getUserByDeviceId(deviceId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('device_id', deviceId)
    .single();

  if (error || !data) {
    return null;
  }

  return rowToUser(data);
}

/**
 * Convert anonymous user to authenticated user
 * Called when anonymous user signs up - updates their existing record
 */
export async function convertToAuthenticatedUser(
  userId: string,
  authId: string,
  email: string,
  displayName: string
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({
      auth_id: authId,
      email: email,
      username: displayName,
      is_anonymous: false,
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to convert user: ${error.message}`);
  }

  return rowToUser(data);
}

/**
 * Create a new authenticated user (for login on new device with no anonymous data)
 */
export async function createAuthenticatedUser(
  authId: string,
  email: string,
  displayName: string,
  deviceId?: string
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      auth_id: authId,
      email: email,
      username: displayName,
      device_id: deviceId || null,
      is_anonymous: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return rowToUser(data);
}

/**
 * Link a device to an authenticated user
 */
export async function linkDeviceToUser(userId: string, deviceId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ device_id: deviceId })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to link device: ${error.message}`);
  }
}

/**
 * Merge anonymous user data into authenticated user
 * Uses the database function for atomic operation
 */
export async function mergeUsers(anonymousUserId: string, authenticatedUserId: string): Promise<void> {
  const { error } = await supabase.rpc('merge_anonymous_user', {
    p_anonymous_user_id: anonymousUserId,
    p_authenticated_user_id: authenticatedUserId,
  });

  if (error) {
    throw new Error(`Failed to merge users: ${error.message}`);
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: { displayName?: string; timezone?: string }
): Promise<User> {
  const updateData: any = {};
  if (updates.displayName !== undefined) {
    updateData.username = updates.displayName;
  }
  if (updates.timezone !== undefined) {
    updateData.timezone = updates.timezone;
  }

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return rowToUser(data);
}

/**
 * Update user's last played timestamp
 */
export async function updateLastPlayed(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ last_played_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update last played:', error);
  }
}

/**
 * Get user stats with additional computed fields
 */
export async function getUserStats(userId: string): Promise<{
  user: User;
  recentGames: any[];
} | null> {
  const user = await getUserById(userId);
  if (!user) {
    return null;
  }

  // Get recent games
  const { data: recentGames } = await supabase
    .from('user_responses')
    .select(`
      id,
      score,
      captured,
      answered_at,
      question:questions(question_text)
    `)
    .eq('user_id', userId)
    .order('answered_at', { ascending: false })
    .limit(10);

  return {
    user,
    recentGames: recentGames || [],
  };
}
