import type {
  ActionType,
  ActorRole,
  LogSortField,
  LogStatus,
  RegionCode,
  ResourceType,
  Severity,
  SortOrder,
} from '@/constants/logs'

export interface SecurityLog {
  id: string
  actor: string
  role: ActorRole
  action: ActionType
  resource: string
  resourceType: ResourceType
  ipAddress: string
  region: string
  severity: Severity
  status: LogStatus
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
  region: RegionCode | ''
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
