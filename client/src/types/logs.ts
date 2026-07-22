import type {
  ActionType,
  ActorRole,
  LogSortField,
  LogStatus,
  ResourceType,
  Severity,
  SortOrder,
} from '@/constants/logs'

export interface SecurityLogActor {
  id: string
  name: string
  email: string
  role: ActorRole
}

export interface SecurityLogResource {
  type: ResourceType
  id: string
  name: string
}

export interface SecurityLog {
  id: string
  actor: SecurityLogActor
  action: ActionType
  resource: SecurityLogResource
  severity: Severity
  status: LogStatus
  ip: string
  region: string
  userAgent: string
  timestamp: string
  createdAt: string
  updatedAt: string
}

export interface LogFilters {
  search: string
  role: ActorRole | ''
  severity: Severity | ''
  status: LogStatus | ''
  action: ActionType | ''
  resourceType: ResourceType | ''
  region: string
  dateFrom: string
  dateTo: string
  page: number
  pageSize: number
  sortBy: LogSortField
  sortOrder: SortOrder
}

export interface DashboardSummary {
  total: number
  bySeverity: Array<{ severity: string; count: number }>
  byStatus: Array<{ status: string; count: number }>
}

export interface BulkUploadFailure {
  index: number
  errors: Array<{ path: string; message: string; code: string }>
}

export interface BulkUploadResult {
  totalReceived: number
  validCount: number
  invalidCount: number
  insertedCount: number
  failures: BulkUploadFailure[]
}
