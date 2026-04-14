import { env } from '../../config/env.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { AdminModel, type AdminDocument } from './admin.model.js';

type AuthenticatedAdmin = {
  id: string;
  email: string;
  displayName: string;
  role: 'admin';
};

const toAuthenticatedAdmin = (admin: AdminDocument): AuthenticatedAdmin => ({
  id: admin._id.toString(),
  email: admin.email,
  displayName: admin.displayName,
  role: admin.role,
});

export async function ensureSeedAdmin() {
  const normalizedEmail = env.INITIAL_ADMIN_EMAIL.trim().toLowerCase();
  const existingAdmin = await AdminModel.findOne({ email: normalizedEmail });

  if (existingAdmin) {
    return existingAdmin;
  }

  return AdminModel.create({
    email: normalizedEmail,
    passwordHash: hashPassword(env.INITIAL_ADMIN_PASSWORD),
    displayName: env.INITIAL_ADMIN_DISPLAY_NAME,
    role: 'admin',
  });
}

export async function authenticateAdmin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const admin = await AdminModel.findOne({ email: normalizedEmail });

  if (!admin) {
    return null;
  }

  const isPasswordValid = verifyPassword(password, admin.passwordHash);

  if (!isPasswordValid) {
    return null;
  }

  return toAuthenticatedAdmin(admin);
}

export async function findAuthenticatedAdminById(adminId: string) {
  const admin = await AdminModel.findById(adminId);

  if (!admin) {
    return null;
  }

  return toAuthenticatedAdmin(admin);
}
