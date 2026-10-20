import type { StaffUser } from '../../src/types';

type CacheEntry = {
  user: StaffUser;
  token: string;
  expiresAt: number;
};

/** Short-lived in-memory auth user cache — avoids a DB round-trip on every CRUD. */
const CACHE_TTL_MS = 45_000;
const byUserId = new Map<string, CacheEntry>();

export function getCachedAuthUser(userId: string, token: string): StaffUser | null {
  const entry = byUserId.get(userId);
  if (!entry) return null;
  if (entry.token !== token || entry.expiresAt <= Date.now()) {
    byUserId.delete(userId);
    return null;
  }
  return entry.user;
}

export function setCachedAuthUser(user: StaffUser, token: string): void {
  byUserId.set(user.id, {
    user,
    token,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function invalidateAuthUser(userId: string): void {
  byUserId.delete(userId);
}

export function clearAuthCache(): void {
  byUserId.clear();
}
