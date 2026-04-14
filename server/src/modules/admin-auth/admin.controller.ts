import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { createAdminAuthToken } from '../../utils/adminAuthToken.js';
import { clearAdminLoginAttempts } from './admin.rate-limit.js';
import { authenticateAdmin } from './admin.service.js';

const buildCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.IS_PRODUCTION,
  path: '/',
  maxAge: 1000 * 60 * 60 * 12,
});

export async function loginAdminController(req: Request, res: Response) {
  const email = typeof req.body.email === 'string' ? req.body.email : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email.trim() || !password) {
    res.status(400).json({
      message: 'Email and password are required.',
    });
    return;
  }

  const admin = await authenticateAdmin(email, password);

  if (!admin) {
    res.status(401).json({
      message: 'Invalid admin credentials.',
    });
    return;
  }

  const token = createAdminAuthToken(admin.id, admin.email);

  clearAdminLoginAttempts(req);
  res.cookie(env.ADMIN_AUTH_COOKIE_NAME, token, buildCookieOptions());
  res.status(200).json({
    admin,
  });
}

export function logoutAdminController(_req: Request, res: Response) {
  res.clearCookie(env.ADMIN_AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.IS_PRODUCTION,
    path: '/',
  });

  res.status(200).json({
    message: 'Logged out successfully.',
  });
}

export function getAdminSessionController(req: Request, res: Response) {
  if (!req.admin) {
    res.status(401).json({
      message: 'Unauthorized.',
    });
    return;
  }

  res.status(200).json({
    admin: req.admin,
  });
}
