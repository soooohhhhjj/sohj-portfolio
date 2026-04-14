import type { NextFunction, Request, Response } from 'express';

type AttemptEntry = {
  count: number;
  firstAttemptAt: number;
};

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attemptsByKey = new Map<string, AttemptEntry>();

const getClientKey = (req: Request) => {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
};

export function limitAdminLoginAttempts(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const clientKey = getClientKey(req);
  const existingEntry = attemptsByKey.get(clientKey);

  if (!existingEntry || now - existingEntry.firstAttemptAt > WINDOW_MS) {
    attemptsByKey.set(clientKey, {
      count: 1,
      firstAttemptAt: now,
    });
    next();
    return;
  }

  if (existingEntry.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil(
      (existingEntry.firstAttemptAt + WINDOW_MS - now) / 1000,
    );

    res.setHeader('Retry-After', String(Math.max(retryAfterSeconds, 1)));
    res.status(429).json({
      message: 'Too many login attempts. Please try again in a few minutes.',
    });
    return;
  }

  existingEntry.count += 1;
  attemptsByKey.set(clientKey, existingEntry);
  next();
}

export function clearAdminLoginAttempts(req: Request) {
  attemptsByKey.delete(getClientKey(req));
}
