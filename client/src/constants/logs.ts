export const ACTOR_ROLES = [
  'admin',
  'user',
  'viewer',
  'service',
  'api',
] as const

export const SEVERITIES = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
] as const

export const LOG_STATUSES = [
  'success',
  'failure',
  'pending',
  'blocked',
] as const

export const RESOURCE_TYPES = [
  'user',
  'file',
  'api_key',
  'database',
  'bucket',
  'server',
  'policy',
  'session',
] as const

export const ACTIONS = [
  'login',
  'logout',
  'create',
  'read',
  'update',
  'delete',
  'upload',
  'download',
  'export',
  'configure',
  'access_denied',
] as const

export const LOG_SORT_FIELDS = [
  'timestamp',
  'severity',
  'status',
  'action',
  'region',
  'actor.name',
  'createdAt',
] as const

export const SORT_ORDERS = ['asc', 'desc'] as const

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 25
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
export const SEARCH_DEBOUNCE_MS = 350

export type ActorRole = (typeof ACTOR_ROLES)[number]
export type Severity = (typeof SEVERITIES)[number]
export type LogStatus = (typeof LOG_STATUSES)[number]
export type ResourceType = (typeof RESOURCE_TYPES)[number]
export type ActionType = (typeof ACTIONS)[number]
export type LogSortField = (typeof LOG_SORT_FIELDS)[number]
export type SortOrder = (typeof SORT_ORDERS)[number]
