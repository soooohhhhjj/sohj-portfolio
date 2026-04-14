import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);
const rootEnvPath = resolve(currentDirPath, '../../../.env');
const serverEnvPath = resolve(currentDirPath, '../../.env');

if (existsSync(rootEnvPath)) {
  loadEnvFile(rootEnvPath);
} else if (existsSync(serverEnvPath)) {
  loadEnvFile(serverEnvPath);
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';

const requireEnv = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const env = {
  NODE_ENV: nodeEnv,
  IS_PRODUCTION: isProduction,
  PORT: Number(process.env.PORT ?? 5000),
  MONGO_URI: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/sohj-portfolio',
  INITIAL_ADMIN_EMAIL: requireEnv('INITIAL_ADMIN_EMAIL', isProduction ? undefined : 'admin'),
  INITIAL_ADMIN_PASSWORD: requireEnv('INITIAL_ADMIN_PASSWORD', isProduction ? undefined : 'admin'),
  INITIAL_ADMIN_DISPLAY_NAME: process.env.INITIAL_ADMIN_DISPLAY_NAME ?? 'Sohj Admin',
  ADMIN_AUTH_COOKIE_NAME: process.env.ADMIN_AUTH_COOKIE_NAME ?? 'sohj_admin_session',
  ADMIN_AUTH_SECRET: requireEnv(
    'ADMIN_AUTH_SECRET',
    isProduction ? undefined : 'local-dev-admin-auth-secret-change-me',
  ),
};
