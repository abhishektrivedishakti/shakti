import { getStoredAuthToken } from './authClient';

export const API_UNAVAILABLE_MSG =
  'Could not reach the API. Run the app with npm run dev and open the URL it prints (usually http://localhost:3000).';

const AUTH_FETCH_TIMEOUT_MS = 15_000;

export async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), AUTH_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Restart the server with npm run dev, then try again.');
    }
    throw new Error(API_UNAVAILABLE_MSG);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function parseJsonResponse<T>(res: Response): Promise<T> {
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
      'Server returned an invalid response. Use npm run dev so Express serves /api routes.'
    );
  }
}

export function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getStoredAuthToken();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiJson<T extends { success: boolean; error?: string }>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetchWithTimeout(url, {
    ...options,
    headers: authHeaders({
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    }),
  });
  const data = await parseJsonResponse<T>(res);
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}
