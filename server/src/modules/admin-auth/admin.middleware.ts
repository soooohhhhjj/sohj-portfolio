import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { verifyAdminAuthToken } from '../../utils/adminAuthToken.js';
import { findAuthenticatedAdminById } from './admin.service.js';

const getCookieValue = (cookieHeader: string | undefined, cookieName: string) => {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';');

  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split('=');

    if (name === cookieName) {
      return valueParts.join('=');
    }
  }

  return null;
};

export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const token = getCookieValue(req.headers.cookie, env.ADMIN_AUTH_COOKIE_NAME);

  if (!token) {
    res.status(401).json({
      message: 'Unauthorized.',
    });
    return;
  }

  const payload = verifyAdminAuthToken(token);

  if (!payload) {
    res.status(401).json({
      message: 'Unauthorized.',
    });
    return;
  }

  const admin = await findAuthenticatedAdminById(payload.adminId);

  if (!admin) {
    res.status(401).json({
      message: 'Unauthorized.',
    });
    return;
  }

  req.admin = admin;
  next();
}
