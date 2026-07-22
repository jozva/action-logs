import type { ActorRole } from '../constants/logs.js';
import type { Permission } from '../constants/permissions.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: ActorRole;
  region: string;
  status: 'active' | 'disabled';
  permissions: readonly Permission[];
}
