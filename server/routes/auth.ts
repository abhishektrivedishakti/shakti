import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { defaultStaffPermissions, fullAdminPermissions } from '../lib/permissions';
import { mapDbUserToStaffUser } from '../lib/userMapper';
import { signAuthToken } from '../lib/authTokens';
import { requireAuth } from '../middleware/auth';
import { sendBadRequest, sendError, sendSuccess, sendUnauthorized } from '../lib/apiResponse';

export const authRouter = Router();

const AVATAR_COLORS = [
  'bg-teal-600',
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-amber-600',
  'bg-cyan-600',
  'bg-violet-600',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function normalizeMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? digits : null;
}

function readPassword(body: Record<string, unknown>): string {
  const raw = body.password ?? body.pin;
  return typeof raw === 'string' ? raw : '';
}

function validatePasswordForRegister(password: string): string | null {
  if (!password) return 'Please enter a password.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 128) return 'Password is too long (max 128 characters).';
  return null;
}

function sendAuthSuccess(res: Response, user: ReturnType<typeof mapDbUserToStaffUser>) {
  const token = signAuthToken({ id: user.id, email: user.email || '' });
  return res.json({
    success: true,
    token,
    user,
  });
}

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const { name, mobile, email, designation } = body;
    const password = readPassword(body);

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Please enter your full name.' });
    }

    const normalizedEmail = normalizeEmail(String(email ?? ''));
    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
    }

    const passwordError = validatePasswordForRegister(password);
    if (passwordError) {
      return res.status(400).json({ success: false, error: passwordError });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'This email is already registered.' });
    }

    const normalizedMobile =
      typeof mobile === 'string' && mobile.trim() ? normalizeMobile(mobile) : null;
    if (typeof mobile === 'string' && mobile.trim() && !normalizedMobile) {
      return res.status(400).json({ success: false, error: 'Mobile must be a 10-digit number if provided.' });
    }

    if (normalizedMobile) {
      const mobileTaken = await prisma.user.findUnique({ where: { mobile: normalizedMobile } });
      if (mobileTaken) {
        return res.status(409).json({ success: false, error: 'This mobile number is already registered.' });
      }
    }

    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;
    const pinHash = await bcrypt.hash(password, 10);
    const colorIndex = userCount % AVATAR_COLORS.length;

    const created = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        ...(normalizedMobile ? { mobile: normalizedMobile } : {}),
        pinHash,
        designation:
          typeof designation === 'string' && designation.trim()
            ? designation.trim()
            : isFirstUser
              ? 'Managing Director / Admin'
              : 'Staff Member',
        role: isFirstUser ? 'admin' : 'custom',
        avatarColor: AVATAR_COLORS[colorIndex],
        permissions: isFirstUser ? fullAdminPermissions() : defaultStaffPermissions(),
      },
    });

    const staffUser = mapDbUserToStaffUser(created);
    return sendAuthSuccess(res, staffUser);
  } catch (err: unknown) {
    console.error('POST /api/auth/register:', err);
    return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const { email } = body;
    const password = readPassword(body);
    const normalizedEmail = normalizeEmail(String(email ?? ''));

    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
    }

    if (!password) {
      return res.status(400).json({ success: false, error: 'Please enter your password.' });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const passwordOk = await bcrypt.compare(password, user.pinHash);
    if (!passwordOk) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return sendAuthSuccess(res, mapDbUserToStaffUser(updated));
  } catch (err: unknown) {
    console.error('POST /api/auth/login:', err);
    return res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
});

authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  return sendSuccess(res, { user: req.authUser });
});

/** Client-side logout; server acknowledges so clients can clear session uniformly. */
authRouter.post('/logout', requireAuth, async (_req: Request, res: Response) => {
  return sendSuccess(res, { message: 'Signed out.' });
});

authRouter.post('/refresh', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.authUser!;
    const token = signAuthToken({ id: user.id, email: user.email || '' });
    return sendSuccess(res, { token, user });
  } catch (err: unknown) {
    console.error('POST /api/auth/refresh:', err);
    return sendError(res, 500, 'Could not refresh session.');
  }
});

authRouter.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!currentPassword) {
      return sendBadRequest(res, 'Enter your current password.');
    }
    const passwordError = validatePasswordForRegister(newPassword);
    if (passwordError) {
      return sendBadRequest(res, passwordError);
    }

    const dbUser = await prisma.user.findUnique({ where: { id: req.authUser!.id } });
    if (!dbUser) {
      return sendUnauthorized(res, 'Account not found.');
    }

    const ok = await bcrypt.compare(currentPassword, dbUser.pinHash);
    if (!ok) {
      return sendUnauthorized(res, 'Current password is incorrect.');
    }

    const pinHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { pinHash },
    });

    return sendSuccess(res, { message: 'Password updated successfully.' });
  } catch (err: unknown) {
    console.error('POST /api/auth/change-password:', err);
    return sendError(res, 500, 'Could not change password.');
  }
});

/**
 * Phase 0 stub: validates email exists and returns a generic success.
 * Real email reset tokens land in a later hardening phase.
 */
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const email = normalizeEmail(String(body.email ?? ''));
    if (!email || !EMAIL_PATTERN.test(email)) {
      return sendBadRequest(res, 'Enter a valid email address.');
    }

    // Always same response to avoid account enumeration
    await prisma.user.findUnique({ where: { email } });

    return sendSuccess(res, {
      message:
        'If an account exists for that email, password reset instructions will be sent when email delivery is enabled.',
    });
  } catch (err: unknown) {
    console.error('POST /api/auth/forgot-password:', err);
    return sendError(res, 500, 'Could not process password reset request.');
  }
});
