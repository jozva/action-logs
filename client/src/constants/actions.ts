import type { ActionType, LogStatus, ResourceType, Severity } from '@/constants/logs'

export interface ActionPolicy {
  action: ActionType
  resourceType: ResourceType
  severity: Severity
  status: LogStatus
  resourcePrefix: string
  description: string
}

export const FALLBACK_ACTION_POLICIES: ActionPolicy[] = [
  {
    action: 'LOGIN',
    resourceType: 'SESSION',
    severity: 'INFO',
    status: 'Resolved',
    resourcePrefix: '/api/sessions',
    description: 'Authenticate into the console',
  },
  {
    action: 'CREATE_USER',
    resourceType: 'USER',
    severity: 'MEDIUM',
    status: 'Unresolved',
    resourcePrefix: '/api/users',
    description: 'Provision a new user account',
  },
  {
    action: 'UPDATE_USER',
    resourceType: 'USER',
    severity: 'MEDIUM',
    status: 'Investigating',
    resourcePrefix: '/api/users',
    description: 'Modify an existing user account',
  },
  {
    action: 'DELETE_USER',
    resourceType: 'USER',
    severity: 'HIGH',
    status: 'Unresolved',
    resourcePrefix: '/api/users',
    description: 'Delete a user account',
  },
  {
    action: 'EXPORT_DATA',
    resourceType: 'DATABASE',
    severity: 'HIGH',
    status: 'Unresolved',
    resourcePrefix: '/api/exports',
    description: 'Export sensitive data',
  },
  {
    action: 'CONFIGURE_POLICY',
    resourceType: 'POLICY',
    severity: 'CRITICAL',
    status: 'Unresolved',
    resourcePrefix: '/api/policies',
    description: 'Change a security policy',
  },
  {
    action: 'UPLOAD_FILE',
    resourceType: 'FILE',
    severity: 'MEDIUM',
    status: 'Investigating',
    resourcePrefix: '/api/files',
    description: 'Upload a file to storage',
  },
  {
    action: 'DOWNLOAD_FILE',
    resourceType: 'FILE',
    severity: 'LOW',
    status: 'Resolved',
    resourcePrefix: '/api/files',
    description: 'Download a file from storage',
  },
  {
    action: 'ACCESS_DENIED',
    resourceType: 'POLICY',
    severity: 'HIGH',
    status: 'Unresolved',
    resourcePrefix: '/api/access',
    description: 'Record a denied access attempt',
  },
]
