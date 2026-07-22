import type { ActionType, ActorRole, ResourceType } from '@/constants/logs'
import type { ActionPolicy } from '@/constants/actions'
import type { SecurityLog } from '@/types/logs'

export interface ExecuteActionPayload {
  actor: string
  role: ActorRole
  action: ActionType
  resourceId?: string
  resource?: string
  resourceType?: ResourceType
  region?: string
  ipAddress?: string
  note?: string
}

export interface ExecuteActionResult {
  action: ActionType
  description: string
  note: string | null
  auditLog: SecurityLog
}

export type ActionCatalogItem = ActionPolicy
