import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { mapDbUserToStaffUser } from '../lib/userMapper';
import { invalidateAuthUser } from '../lib/authCache';
import {
  normalizePermissions,
  permissionsForRole,
  ROLE_TEMPLATES,
} from '../lib/permissions';
import {
  sendBadRequest,
  sendError,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/apiResponse';
import type { StaffRole } from '../../src/types';

export const staffRouter = Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES: StaffRole[] = [
  'admin',
  'fleet_manager',
  'accountant',
  'field_supervisor',
  'office_boy_cashier',
  'billing_clerk',
  'custom',
];

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function normalizeMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? digits : null;
}

function readStaffSecret(body: Record<string, unknown>): string {
  if (typeof body.password === 'string' && body.password) return body.password;
  if (typeof body.pin === 'string' && body.pin) return body.pin;
  return '';
}

function validateStaffSecret(secret: string): string | null {
  if (!secret) return 'Provide a password (min 8 chars) or PIN (4–6 digits).';
  if (/^\d{4,6}$/.test(secret)) return null;
  if (secret.length >= 8 && secret.length <= 128) return null;
  return 'Password must be at least 8 characters, or PIN must be 4–6 digits.';
}

staffRouter.get('/roles/templates', requireAuth, async (_req: Request, res: Response) => {
  const templates = ROLE_TEMPLATES.map((t) => ({
    ...t,
    permissions: permissionsForRole(t.role),
  }));
  return sendSuccess(res, { templates });
});

staffRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (req.authUser?.role !== 'admin' && req.authUser?.permissions?.staff_management?.canView === false) {
      return sendForbidden(res);
    }
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return sendSuccess(res, { staff: users.map(mapDbUserToStaffUser) });
  } catch (err) {
    console.error('GET /api/staff:', err);
    return sendError(res, 500, 'Could not load staff.');
  }
});

staffRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return sendNotFound(res, 'Staff member not found.');

    const isSelf = req.authUser?.id === user.id;
    const canView =
      isSelf ||
      req.authUser?.role === 'admin' ||
      req.authUser?.permissions?.staff_management?.canView;
    if (!canView) return sendForbidden(res);

    return sendSuccess(res, { staff: mapDbUserToStaffUser(user) });
  } catch (err) {
    console.error('GET /api/staff/:id:', err);
    return sendError(res, 500, 'Could not load staff member.');
  }
});

staffRouter.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const designation =
      typeof body.designation === 'string' && body.designation.trim()
        ? body.designation.trim()
        : 'Staff Member';
    const roleRaw = typeof body.role === 'string' ? body.role : 'custom';
    const role = (VALID_ROLES.includes(roleRaw as StaffRole) ? roleRaw : 'custom') as StaffRole;
    const mobile = normalizeMobile(String(body.mobile ?? ''));
    let email =
      typeof body.email === 'string' && body.email.trim()
        ? normalizeEmail(body.email)
        : mobile
          ? `${mobile}@staff.shakti.local`
          : '';
    const secret = readStaffSecret(body);
    const avatarColor =
      typeof body.avatarColor === 'string' && body.avatarColor
        ? body.avatarColor
        : 'bg-teal-600';

    if (name.length < 2) return sendBadRequest(res, 'Enter staff full name.');
    if (!mobile) return sendBadRequest(res, 'Enter a valid 10-digit mobile number.');
    if (!email || !EMAIL_PATTERN.test(email)) return sendBadRequest(res, 'Enter a valid email.');
    const secretErr = validateStaffSecret(secret);
    if (secretErr) return sendBadRequest(res, secretErr);

    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) return sendError(res, 409, 'This email is already registered.');
    const mobileTaken = await prisma.user.findUnique({ where: { mobile } });
    if (mobileTaken) return sendError(res, 409, 'This mobile number is already registered.');

    const permissions =
      body.permissions != null ? normalizePermissions(body.permissions) : permissionsForRole(role);
    if (role === 'admin') {
      Object.assign(permissions, permissionsForRole('admin'));
    }

    const created = await prisma.user.create({
      data: {
        name,
        designation,
        role,
        mobile,
        email,
        pinHash: await bcrypt.hash(secret, 10),
        avatarColor,
        status: 'active',
        permissions,
      },
    });

    return sendSuccess(res, { staff: mapDbUserToStaffUser(created) }, 201);
  } catch (err) {
    console.error('POST /api/staff:', err);
    return sendError(res, 500, 'Could not create staff member.');
  }
});

staffRouter.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Staff member not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    if (typeof body.name === 'string' && body.name.trim().length >= 2) data.name = body.name.trim();
    if (typeof body.designation === 'string') data.designation = body.designation.trim() || existing.designation;
    if (typeof body.avatarColor === 'string' && body.avatarColor) data.avatarColor = body.avatarColor;

    if (typeof body.role === 'string' && VALID_ROLES.includes(body.role as StaffRole)) {
      data.role = body.role;
      if (body.permissions == null) {
        data.permissions = permissionsForRole(body.role as StaffRole);
      }
    }

    if (body.permissions != null) {
      data.permissions = normalizePermissions(body.permissions);
    }

    if (typeof body.email === 'string' && body.email.trim()) {
      const email = normalizeEmail(body.email);
      if (!EMAIL_PATTERN.test(email)) return sendBadRequest(res, 'Enter a valid email.');
      if (email !== existing.email) {
        const taken = await prisma.user.findUnique({ where: { email } });
        if (taken) return sendError(res, 409, 'This email is already registered.');
      }
      data.email = email;
    }

    if (typeof body.mobile === 'string' && body.mobile.trim()) {
      const mobile = normalizeMobile(body.mobile);
      if (!mobile) return sendBadRequest(res, 'Enter a valid 10-digit mobile.');
      if (mobile !== existing.mobile) {
        const taken = await prisma.user.findUnique({ where: { mobile } });
        if (taken) return sendError(res, 409, 'This mobile number is already registered.');
      }
      data.mobile = mobile;
    }

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data,
    });
    invalidateAuthUser(updated.id);

    return sendSuccess(res, { staff: mapDbUserToStaffUser(updated) });
  } catch (err) {
    console.error('PUT /api/staff/:id:', err);
    return sendError(res, 500, 'Could not update staff member.');
  }
});

staffRouter.patch('/:id/permissions', requireAdmin, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Staff member not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const permissions = normalizePermissions(body.permissions ?? body);
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { permissions },
    });
    invalidateAuthUser(updated.id);
    return sendSuccess(res, { staff: mapDbUserToStaffUser(updated) });
  } catch (err) {
    console.error('PATCH /api/staff/:id/permissions:', err);
    return sendError(res, 500, 'Could not update permissions.');
  }
});

staffRouter.patch('/:id/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Staff member not found.');

    if (existing.id === req.authUser?.id) {
      return sendBadRequest(res, 'You cannot deactivate your own account.');
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const status = body.status === 'inactive' ? 'inactive' : body.status === 'active' ? 'active' : null;
    if (!status) return sendBadRequest(res, 'status must be active or inactive.');

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { status },
    });
    invalidateAuthUser(updated.id);
    return sendSuccess(res, { staff: mapDbUserToStaffUser(updated) });
  } catch (err) {
    console.error('PATCH /api/staff/:id/status:', err);
    return sendError(res, 500, 'Could not update status.');
  }
});

staffRouter.post('/:id/reset-password', requireAdmin, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Staff member not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const secret = readStaffSecret(body);
    const secretErr = validateStaffSecret(secret);
    if (secretErr) return sendBadRequest(res, secretErr);

    await prisma.user.update({
      where: { id: existing.id },
      data: { pinHash: await bcrypt.hash(secret, 10) },
    });
    invalidateAuthUser(existing.id);

    return sendSuccess(res, { message: 'Password/PIN reset successfully.' });
  } catch (err) {
    console.error('POST /api/staff/:id/reset-password:', err);
    return sendError(res, 500, 'Could not reset password.');
  }
});

staffRouter.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Staff member not found.');

    if (existing.id === req.authUser?.id) {
      return sendBadRequest(res, 'You cannot delete your own account.');
    }

    // Soft-delete: deactivate (preserve audit trail)
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { status: 'inactive' },
    });
    invalidateAuthUser(updated.id);

    return sendSuccess(res, {
      staff: mapDbUserToStaffUser(updated),
      message: 'Staff member deactivated.',
    });
  } catch (err) {
    console.error('DELETE /api/staff/:id:', err);
    return sendError(res, 500, 'Could not delete staff member.');
  }
});
