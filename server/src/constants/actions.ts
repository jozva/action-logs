import type {
  ActionType,
  LogStatus,
  ResourceType,
  Severity,
} from './logs.js';

export interface ActionPolicy {
  resourceType: ResourceType;
  severity: Severity;
  status: LogStatus;
  resourcePrefix: string;
  description: string;
}

export const ACTION_POLICIES: Record<ActionType, ActionPolicy> = {
  LOGIN: {
    resourceType: 'SESSION',
    severity: 'INFO',
    status: 'Resolved',
    resourcePrefix: '/api/sessions',
    description: 'Authenticate into the console',
  },
  LOGOUT: {
    resourceType: 'SESSION',
    severity: 'INFO',
    status: 'Resolved',
    resourcePrefix: '/api/sessions',
    description: 'End the current console session',
  },
  CREATE_USER: {
    resourceType: 'USER',
    severity: 'MEDIUM',
    status: 'Unresolved',
    resourcePrefix: '/api/users',
    description: 'Provision a new user account',
  },
  UPDATE_USER: {
    resourceType: 'USER',
    severity: 'MEDIUM',
    status: 'Investigating',
    resourcePrefix: '/api/users',
    description: 'Modify an existing user account',
  },
  DELETE_USER: {
    resourceType: 'USER',
    severity: 'HIGH',
    status: 'Unresolved',
    resourcePrefix: '/api/users',
    description: 'Delete a user account',
  },
  READ_RESOURCE: {
    resourceType: 'FILE',
    severity: 'LOW',
    status: 'Resolved',
    resourcePrefix: '/api/resources',
    description: 'Read a protected resource',
  },
  UPDATE_RESOURCE: {
    resourceType: 'FILE',
    severity: 'MEDIUM',
    status: 'Investigating',
    resourcePrefix: '/api/resources',
    description: 'Update a protected resource',
  },
  DELETE_RESOURCE: {
    resourceType: 'FILE',
    severity: 'HIGH',
    status: 'Unresolved',
    resourcePrefix: '/api/resources',
    description: 'Delete a protected resource',
  },
  UPLOAD_FILE: {
    resourceType: 'FILE',
    severity: 'MEDIUM',
    status: 'Investigating',
    resourcePrefix: '/api/files',
    description: 'Upload a file to storage',
  },
  DOWNLOAD_FILE: {
    resourceType: 'FILE',
    severity: 'LOW',
    status: 'Resolved',
    resourcePrefix: '/api/files',
    description: 'Download a file from storage',
  },
  EXPORT_DATA: {
    resourceType: 'DATABASE',
    severity: 'HIGH',
    status: 'Unresolved',
    resourcePrefix: '/api/exports',
    description: 'Export sensitive data',
  },
  CONFIGURE_POLICY: {
    resourceType: 'POLICY',
    severity: 'CRITICAL',
    status: 'Unresolved',
    resourcePrefix: '/api/policies',
    description: 'Change a security policy',
  },
  ACCESS_DENIED: {
    resourceType: 'POLICY',
    severity: 'HIGH',
    status: 'Unresolved',
    resourcePrefix: '/api/access',
    description: 'Record a denied access attempt',
  },
};

export const DEFAULT_ACTION_REGION = 'ap-south-1';
