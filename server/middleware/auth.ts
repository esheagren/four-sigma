import { Request, Response, NextFunction } from 'express';
import { supabase } from '../database/supabase.js';
import { getOrCreateDeviceUser, getUserByAuthId, getUserByDeviceId } from '../database/users.js';
import { AuthUser } from '../types/index.js';

/**
 * Extract device ID from request header
 */
export function extractDeviceId(req: Request): string | null {
  return req.headers['x-device-id'] as string || null;
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
 * Middleware: Attach user to request (anonymous or authenticated)
 * This middleware tries to identify the user in this order:
 * 1. Check for Bearer token (authenticated user)
 * 2. Check for X-Device-Id header (anonymous user)
 * 3. If neither, request proceeds without user context
 */
export async function attachUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const requestPath = req.path;

  try {
    // Check for Bearer token first (authenticated user)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const validatedAuth = await validateAuthToken(token);

      if (validatedAuth) {
        const user = await getUserByAuthId(validatedAuth.authId);
        if (user) {
          req.user = {
            userId: user.id,
            authId: user.authId,
            isAnonymous: false,
          };
          next();
          return;
        } else {
          console.warn(`[Auth] Bearer token valid but no user found for authId: ${validatedAuth.authId} (path: ${requestPath})`);
        }
      } else {
        console.warn(`[Auth] Bearer token validation failed (path: ${requestPath})`);
      }
    }

    // Check for device ID (anonymous user)
    const deviceId = extractDeviceId(req);
    if (deviceId) {
      const user = await getUserByDeviceId(deviceId);
      if (user) {
        req.user = {
          userId: user.id,
          authId: user.authId,
          isAnonymous: user.isAnonymous,
        };
      } else {
        console.warn(`[Auth] No user found for deviceId: ${deviceId} (path: ${requestPath})`);
      }
      // Note: We don't auto-create users here - that happens at /api/auth/device
    }

    // Log when no user context could be established for session endpoints
    if (!req.user && (requestPath.includes('/session/start') || requestPath.includes('/session/finalize'))) {
      console.warn(`[Auth] No user context for ${requestPath} - answers will not be persisted to database`);
    }

    next();
  } catch (err) {
    console.error(`[Auth] Middleware error on ${requestPath}:`, err);
    next();
  }
}

/**
 * Middleware: Require any user (anonymous or authenticated)
 */
export function requireUser(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'User identification required. Send X-Device-Id header or Bearer token.' });
    return;
  }
  next();
}

/**
 * Middleware: Require authenticated user (not anonymous)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (req.user.isAnonymous) {
    res.status(403).json({ error: 'This action requires a signed-in account' });
    return;
  }
  next();
}
