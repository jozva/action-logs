import type { ActorRole } from '@/constants/logs'

export type Permission =
  | 'user:read'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  | 'file:read'
  | 'file:upload'
  | 'file:download'
  | 'export:create'
  | 'policy:read'
  | 'policy:update'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: ActorRole
  region: string
  status: 'active' | 'disabled'
  permissions: Permission[]
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface AppUser {
  id: string
  name: string
  email: string
  role: ActorRole
  region: string
  status: 'active' | 'disabled'
  lastLoginAt: string | null
  createdAt?: string
  updatedAt?: string
}
