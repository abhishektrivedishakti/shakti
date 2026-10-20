import type { Response } from 'express';

export type ApiSuccess<T extends Record<string, unknown> = Record<string, unknown>> = {
  success: true;
} & T;

export type ApiFailure = {
  success: false;
  error: string;
};

export function sendSuccess<T extends Record<string, unknown>>(
  res: Response,
  data: T,
  status = 200
): Response {
  return res.status(status).json({ success: true, ...data } satisfies ApiSuccess<T>);
}

export function sendError(res: Response, status: number, error: string): Response {
  return res.status(status).json({ success: false, error } satisfies ApiFailure);
}

export function sendUnauthorized(res: Response, error = 'Not authenticated.'): Response {
  return sendError(res, 401, error);
}

export function sendForbidden(res: Response, error = 'You do not have permission for this action.'): Response {
  return sendError(res, 403, error);
}

export function sendNotFound(res: Response, error = 'Resource not found.'): Response {
  return sendError(res, 404, error);
}

export function sendBadRequest(res: Response, error: string): Response {
  return sendError(res, 400, error);
}

export function sendServerError(res: Response, error = 'Internal server error'): Response {
  return sendError(res, 500, error);
}
