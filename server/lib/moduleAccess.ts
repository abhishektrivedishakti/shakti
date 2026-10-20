import type { Request } from 'express';
import type { ModulePermissionKey } from '../../src/types';

export function canViewModule(req: Request, key: ModulePermissionKey): boolean {
  const u = req.authUser;
  if (!u) return false;
  if (u.role === 'admin') return true;
  return Boolean(u.permissions?.[key]?.canView);
}

export function canEditModule(req: Request, key: ModulePermissionKey): boolean {
  const u = req.authUser;
  if (!u) return false;
  if (u.role === 'admin') return true;
  return Boolean(u.permissions?.[key]?.canEdit);
}
