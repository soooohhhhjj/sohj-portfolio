import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

type AdminAuthTokenPayload = {
  adminId: string;
  email: string;
  exp: number;
};

const encodeBase64Url = (value: string) => Buffer.from(value, 'utf8').toString('base64url');

const decodeBase64Url = (value: string) => Buffer.from(value, 'base64url').toString('utf8');

const sign = (value: string) =>
  createHmac('sha256', env.ADMIN_AUTH_SECRET).update(value).digest('base64url');

export function createAdminAuthToken(adminId: string, email: string) {
  const payload: AdminAuthTokenPayload = {
    adminId,
    email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyAdminAuthToken(token: string): AdminAuthTokenPayload | null {
  const [encodedPayload, providedSignature] = token.split('.');

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as AdminAuthTokenPayload;

    if (!payload.adminId || !payload.email || !payload.exp) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
