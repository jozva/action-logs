import type { ActorRole } from './logs.js';

export const PERMISSIONS = {
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  FILE_READ: 'file:read',
  FILE_UPLOAD: 'file:upload',
  FILE_DOWNLOAD: 'file:download',
  EXPORT_CREATE: 'export:create',
  POLICY_READ: 'policy:read',
  POLICY_UPDATE: 'policy:update',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<ActorRole, readonly Permission[]> = {
  admin: Object.values(PERMISSIONS),
  auditor: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.FILE_READ,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.EXPORT_CREATE,
    PERMISSIONS.POLICY_READ,
  ],
  user: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.FILE_READ,
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.EXPORT_CREATE,
    PERMISSIONS.POLICY_READ,
  ],
  viewer: [PERMISSIONS.USER_READ, PERMISSIONS.FILE_READ, PERMISSIONS.POLICY_READ],
  service: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.FILE_READ,
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.EXPORT_CREATE,
  ],
};

export function roleHasPermission(role: ActorRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsForRole(role: ActorRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
