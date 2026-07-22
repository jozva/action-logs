import { ConflictError, ForbiddenError, NotFoundError } from '../errors/AppError.js';
import * as userRepository from '../repositories/userRepository.js';
import type { AuthenticatedUser } from '../types/auth.js';
import { hashPassword } from '../utils/password.js';
import { recordAuditEvent } from './auditService.js';
import type {
  CreateUserInput,
  UpdateUserInput,
} from '../validators/authValidators.js';

export async function listUsersForActor(actor: AuthenticatedUser) {
  void actor;
  return userRepository.listUsers();
}

export async function createUserAsAdmin(
  actor: AuthenticatedUser,
  input: CreateUserInput,
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
    role: input.role,
    region: meta.region,
  });

  await recordAuditEvent({
    actor: actor.email,
    role: actor.role,
    action: 'CREATE_USER',
    resource: `/api/users/${created.id}`,
    resourceType: 'USER',
    ipAddress: meta.ipAddress,
    region: meta.region,
  });

  return created;
}

export async function updateUserAsActor(
  actor: AuthenticatedUser,
  userId: string,
  input: UpdateUserInput,
  meta: { ipAddress: string },
) {
  const existing = await userRepository.findUserById(userId);
  if (!existing) {
    throw new NotFoundError('User not found');
  }

  const isSelf = actor.id === userId;
  const isAdmin = actor.role === 'admin';

  if (!isAdmin && !isSelf) {
    throw new ForbiddenError('You can only update your own profile');
  }

  if (!isAdmin && (input.role || input.status)) {
    throw new ForbiddenError('Only admins can change role or status');
  }

  const updates: Parameters<typeof userRepository.updateUser>[1] = {};
  if (input.name) updates.name = input.name;
  if (isAdmin && input.role) updates.role = input.role;
  if (isAdmin && input.status) updates.status = input.status;
  if (input.password) updates.passwordHash = await hashPassword(input.password);

  const updated = await userRepository.updateUser(userId, updates);
  if (!updated) {
    throw new NotFoundError('User not found');
  }

  await recordAuditEvent({
    actor: actor.email,
    role: actor.role,
    action: 'UPDATE_USER',
    resource: `/api/users/${userId}`,
    resourceType: 'USER',
    ipAddress: meta.ipAddress,
    region: actor.region,
  });

  return updated;
}

export async function deleteUserAsAdmin(
  actor: AuthenticatedUser,
  userId: string,
  meta: { ipAddress: string },
) {
  if (actor.id === userId) {
    throw new ForbiddenError('You cannot delete your own account');
  }

  const deleted = await userRepository.deleteUser(userId);
  if (!deleted) {
    throw new NotFoundError('User not found');
  }

  await recordAuditEvent({
    actor: actor.email,
    role: actor.role,
    action: 'DELETE_USER',
    resource: `/api/users/${userId}`,
    resourceType: 'USER',
    ipAddress: meta.ipAddress,
    region: actor.region,
  });

  return deleted;
}
