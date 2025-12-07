import { supabase } from './supabase.js';
import { User } from './types.js';
import { rowToUser, getUserById } from './auth.js';

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
      display_name: 'Guest Player',
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
 * Convert anonymous user to authenticated user
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
      display_name: displayName,
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
 * Create a new authenticated user
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
      display_name: displayName,
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
  updates: { displayName?: string; timezone?: string; themePreference?: string }
): Promise<User> {
  const updateData: any = {};
  if (updates.displayName !== undefined) {
    updateData.display_name = updates.displayName;
  }
  if (updates.timezone !== undefined) {
    updateData.timezone = updates.timezone;
  }
  if (updates.themePreference !== undefined) {
    updateData.theme_preference = updates.themePreference;
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
 * Get user stats with additional computed fields
 */
export async function getUserStats(userId: string): Promise<{
  user: User;
  recentGames: any[];
  categoryStats: any[];
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

  // Get category stats
  const { data: categoryStats } = await supabase
    .from('user_category_stats')
    .select(`
      *,
      subcategory:subcategories(
        name,
        category:categories(
          name,
          domain:domains(name)
        )
      )
    `)
    .eq('user_id', userId)
    .order('total_score', { ascending: false });

  return {
    user,
    recentGames: recentGames || [],
    categoryStats: categoryStats || [],
  };
}
