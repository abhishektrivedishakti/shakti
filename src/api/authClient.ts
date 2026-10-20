import type { StaffUser } from '../types';

export const AUTH_TOKEN_KEY = 'shakti_auth_token';
export const AUTH_USER_KEY = 'shakti_auth_user';

const AUTH_FETCH_TIMEOUT_MS = 15_000;

export type AuthSuccessResponse = {
  success: true;
  token: string;
  user: StaffUser;
};

export type AuthErrorResponse = {
  success: false;
  error: string;
};

const API_UNAVAILABLE_MSG =
  'Could not reach the login API. Run the app with npm run dev and open the URL it prints (usually http://localhost:3000).';

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), AUTH_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        'Request timed out. Restart the server with npm run dev, then try again.'
      );
    }
    throw new Error(API_UNAVAILABLE_MSG);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    if (res.status === 404) {
      throw new Error(API_UNAVAILABLE_MSG);
    }
    throw new Error(
      res.ok
        ? 'Server returned an empty response. Restart with npm run dev.'
        : `${API_UNAVAILABLE_MSG} (HTTP ${res.status})`
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      'Server returned an invalid response. Use npm run dev so Express serves /api/auth routes.'
    );
  }
}

export function getStoredAuthToken(): string | null {
  try {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function persistAuthSession(token: string, user: StaffUser): void {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
}

export function getStoredAuthUser(): StaffUser | null {
  try {
    const raw = sessionStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StaffUser;
  } catch {
    return null;
  }
}

export async function loginWithApi(email: string, password: string): Promise<AuthSuccessResponse> {
  const res = await fetchWithTimeout('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  const data = await parseJsonResponse<AuthSuccessResponse | AuthErrorResponse>(res);
  if (!res.ok || !data.success) {
    throw new Error(!data.success ? data.error : 'Login failed');
  }
  return data;
}

export async function registerWithApi(payload: {
  name: string;
  email: string;
  password: string;
  mobile?: string;
  designation?: string;
}): Promise<AuthSuccessResponse> {
  const res = await fetchWithTimeout('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      email: payload.email.trim().toLowerCase(),
    }),
  });
  const data = await parseJsonResponse<AuthSuccessResponse | AuthErrorResponse>(res);
  if (!res.ok || !data.success) {
    throw new Error(!data.success ? data.error : 'Registration failed');
  }
  return data;
}

export async function fetchCurrentUser(): Promise<StaffUser | null> {
  const token = getStoredAuthToken();
  if (!token) return null;

  let res: Response;
  try {
    res = await fetchWithTimeout('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    clearAuthSession();
    return null;
  }

  const text = await res.text();
  if (!text.trim()) {
    clearAuthSession();
    return null;
  }

  let data: { success: boolean; user?: StaffUser; error?: string };
  try {
    data = JSON.parse(text);
  } catch {
    clearAuthSession();
    return null;
  }

  if (!res.ok || !data.success || !data.user) {
    clearAuthSession();
    return null;
  }
  persistAuthSession(token, data.user);
  return data.user;
}
