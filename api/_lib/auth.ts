import type { VercelRequest } from '@vercel/node';
import { supabase } from './supabase';
import { AuthUser, User } from './types';

// Helper to convert database row to User type
export function rowToUser(row: any): User {
  return {
    id: row.id,
    deviceId: row.device_id,
    authId: row.auth_id,
    email: row.email,
    displayName: row.display_name,
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
 * Extract device ID from request header
 */
export function extractDeviceId(req: VercelRequest): string | null {
  return (req.headers['x-device-id'] as string) || null;
}

/**
 * Extract and validate Supabase JWT from Authorization header
 */
export async function validateAuthToken(token: string): Promise<{ authId: string } | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return { authId: user.id };
  } catch (err) {
    console.error('Token validation error:', err);
    return null;
  }
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
 * Attach user to request - returns user info or null
 */
export async function getAuthUser(req: VercelRequest): Promise<AuthUser | null> {
  try {
    // Check for Bearer token first (authenticated user)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const validatedAuth = await validateAuthToken(token);

      if (validatedAuth) {
        const user = await getUserByAuthId(validatedAuth.authId);
        if (user) {
          return {
            userId: user.id,
            authId: user.authId,
            isAnonymous: false,
          };
        }
      }
    }

    // Check for device ID (anonymous user)
    const deviceId = extractDeviceId(req);
    if (deviceId) {
      const user = await getUserByDeviceId(deviceId);
      if (user) {
        return {
          userId: user.id,
          authId: user.authId,
          isAnonymous: user.isAnonymous,
        };
      }
    }

    return null;
  } catch (err) {
    console.error('Auth error:', err);
    return null;
  }
}
