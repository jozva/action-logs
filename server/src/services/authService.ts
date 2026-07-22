import { permissionsForRole } from '../constants/permissions.js';
import type { ActorRole } from '../constants/logs.js';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../errors/AppError.js';
import * as userRepository from '../repositories/userRepository.js';
import type { AuthenticatedUser } from '../types/auth.js';
import { signAuthToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import type { LoginInput, RegisterInput } from '../validators/authValidators.js';
import { recordAuditEvent } from './auditService.js';

function toAuthUser(user: {
  id: string;
  email: string;
  name: string;
  role: ActorRole;
  region: string;
  status: 'active' | 'disabled';
}): AuthenticatedUser {
  return {
    ...user,
    permissions: permissionsForRole(user.role),
  };
}

export async function registerAccount(
  input: RegisterInput,
  meta: { ipAddress: string; region: string },
) {
  const existing = await userRepository.findUserByEmail(input.email);
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const created = await userRepository.createUser({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role: 'user',
    region: input.region,
  });

  await recordAuditEvent({
    actor: created.email,
    role: 'user',
    action: 'CREATE_USER',
    resource: `/api/users/${created.id}`,
    resourceType: 'USER',
    ipAddress: meta.ipAddress,
    region: meta.region,
  });

  const authUser = toAuthUser(created);
  const token = signAuthToken({
    sub: authUser.id,
    email: authUser.email,
    role: authUser.role,
    name: authUser.name,
  });

  return { token, user: authUser };
}

export async function loginAccount(
  input: LoginInput,
  meta: { ipAddress: string; region: string },
) {
  const user = await userRepository.findUserByEmail(input.email, true);
  if (!user?.passwordHash) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (user.status !== 'active') {
    throw new UnauthorizedError('Account is disabled');
  }

  const valid = await verifyPassword(input.password, String(user.passwordHash));
  if (!valid) {
    await recordAuditEvent({
      actor: String(user.email),
      role: user.role as ActorRole,
      action: 'ACCESS_DENIED',
      resource: '/api/auth/login',
      resourceType: 'SESSION',
      ipAddress: meta.ipAddress,
      region: meta.region,
    });
    throw new UnauthorizedError('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  await recordAuditEvent({
    actor: String(user.email),
    role: user.role as ActorRole,
    action: 'LOGIN',
    resource: `/api/sessions/${String(user._id)}`,
    resourceType: 'SESSION',
    ipAddress: meta.ipAddress,
    region: String(user.region),
  });

  const authUser = toAuthUser({
    id: String(user._id),
    email: String(user.email),
    name: String(user.name),
    role: user.role as ActorRole,
    region: String(user.region),
    status: user.status as 'active' | 'disabled',
  });

  const token = signAuthToken({
    sub: authUser.id,
    email: authUser.email,
    role: authUser.role,
    name: authUser.name,
  });

  return { token, user: authUser };
}

export async function logoutAccount(
  user: AuthenticatedUser,
  meta: { ipAddress: string },
) {
  await recordAuditEvent({
    actor: user.email,
    role: user.role,
    action: 'LOGOUT',
    resource: `/api/sessions/${user.id}`,
    resourceType: 'SESSION',
    ipAddress: meta.ipAddress,
    region: user.region,
  });

  return { success: true };
}

export async function getCurrentUser(userId: string) {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new ValidationError('User not found');
  }

  return toAuthUser({
    id: String(user._id),
    email: String(user.email),
    name: String(user.name),
    role: user.role as ActorRole,
    region: String(user.region),
    status: user.status as 'active' | 'disabled',
  });
}
