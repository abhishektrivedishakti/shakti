import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'shakti-dev-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

export type AuthTokenPayload = {
  sub: string;
  email: string;
};

export function signAuthToken(user: { id: string; email: string }): string {
  return jwt.sign(
    { sub: user.id, email: user.email.toLowerCase() } satisfies AuthTokenPayload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'object' && decoded !== null && 'sub' in decoded) {
      const sub = String((decoded as { sub: unknown }).sub);
      const email =
        'email' in decoded && typeof (decoded as { email: unknown }).email === 'string'
          ? (decoded as { email: string }).email
          : '';
      return { sub, email };
    }
    return null;
  } catch {
    return null;
  }
}
