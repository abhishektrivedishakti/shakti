import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../prisma';
import { verifyAuthToken } from '../lib/authTokens';
import { mapDbUserToStaffUser } from '../lib/userMapper';
import { getCachedAuthUser, setCachedAuthUser } from '../lib/authCache';
import { sendForbidden, sendUnauthorized } from '../lib/apiResponse';
import type { StaffUser } from '../../src/types';

export type AuthRequestUser = StaffUser;

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthRequestUser;
      authToken?: string;
    }
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim() || null;
  return null;
}

async function resolveAuthUser(
  req: Request
): Promise<{ ok: true; user: StaffUser; token: string } | { ok: false; error: string }> {
  const token = extractBearerToken(req);
  if (!token) {
    return { ok: false, error: 'Not authenticated.' };
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return { ok: false, error: 'Session expired. Please sign in again.' };
  }

  const cached = getCachedAuthUser(payload.sub, token);
  if (cached) {
    return { ok: true, user: cached, token };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      designation: true,
      role: true,
      avatarColor: true,
      status: true,
      permissions: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
  if (!user || user.status !== 'active') {
    return { ok: false, error: 'Account not found or inactive.' };
  }

  const mapped = mapDbUserToStaffUser(user);
  setCachedAuthUser(mapped, token);
  return { ok: true, user: mapped, token };
}

/** Requires a valid JWT and an active user. Attaches `req.authUser`. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await resolveAuthUser(req);
    if (!result.ok) {
      return sendUnauthorized(res, result.error);
    }
    req.authToken = result.token;
    req.authUser = result.user;
    return next();
  } catch (err) {
    console.error('requireAuth:', err);
    return sendUnauthorized(res, 'Could not verify session.');
  }
}

/** Requires authenticated admin role. */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await resolveAuthUser(req);
    if (!result.ok) {
      return sendUnauthorized(res, result.error);
    }
    if (result.user.role !== 'admin') {
      return sendForbidden(res, 'Admin access required.');
    }
    req.authToken = result.token;
    req.authUser = result.user;
    return next();
  } catch (err) {
    console.error('requireAdmin:', err);
    return sendUnauthorized(res, 'Could not verify session.');
  }
}

/** Requires one of the given roles (admin always allowed). */
export function requireRoles(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await resolveAuthUser(req);
      if (!result.ok) {
        return sendUnauthorized(res, result.error);
      }
      if (result.user.role !== 'admin' && !roles.includes(result.user.role)) {
        return sendForbidden(res);
      }
      req.authToken = result.token;
      req.authUser = result.user;
      return next();
    } catch (err) {
      console.error('requireRoles:', err);
      return sendUnauthorized(res, 'Could not verify session.');
    }
  };
}
