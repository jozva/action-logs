export const ACTOR_ROLES = [
  'admin',
  'user',
  'viewer',
  'service',
  'auditor',
] as const

export const REGIONS = [
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'us-east-1',
  'us-west-2',
  'sa-east-1',
  'me-central-1',
] as const

export const SEVERITIES = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
  'INFO',
] as const

export const LOG_STATUSES = [
  'Unresolved',
  'Investigating',
  'Resolved',
  'Dismissed',
] as const

export const RESOURCE_TYPES = [
  'USER',
  'FILE',
  'API_KEY',
  'DATABASE',
  'BUCKET',
  'SERVER',
  'POLICY',
  'SESSION',
] as const

export const ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'CREATE_USER',
  'UPDATE_USER',
  'DELETE_USER',
  'READ_RESOURCE',
  'UPDATE_RESOURCE',
  'DELETE_RESOURCE',
  'UPLOAD_FILE',
  'DOWNLOAD_FILE',
  'EXPORT_DATA',
  'CONFIGURE_POLICY',
  'ACCESS_DENIED',
] as const

export const LOG_SORT_FIELDS = [
  'timestamp',
  'severity',
  'status',
  'action',
  'region',
  'actor',
  'createdAt',
] as const

export const SORT_ORDERS = ['asc', 'desc'] as const

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 25
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
export const SEARCH_DEBOUNCE_MS = 350

export type ActorRole = (typeof ACTOR_ROLES)[number]
export type RegionCode = (typeof REGIONS)[number]
export type Severity = (typeof SEVERITIES)[number]
export type LogStatus = (typeof LOG_STATUSES)[number]
export type ResourceType = (typeof RESOURCE_TYPES)[number]
export type ActionType = (typeof ACTIONS)[number]
export type LogSortField = (typeof LOG_SORT_FIELDS)[number]
export type SortOrder = (typeof SORT_ORDERS)[number]
