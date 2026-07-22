import { ACTION_POLICIES } from '../constants/actions.js';
import type { ActionType, ActorRole, ResourceType } from '../constants/logs.js';
import * as logRepository from '../repositories/logRepository.js';
import type { SecurityLogInput } from '../validators/logValidators.js';

export interface AuditContext {
  actor: string;
  role: ActorRole;
  action: ActionType;
  resource: string;
  resourceType?: ResourceType;
  ipAddress: string;
  region: string;
}

export async function recordAuditEvent(context: AuditContext) {
  const policy = ACTION_POLICIES[context.action];

  const payload: SecurityLogInput = {
    actor: context.actor.toLowerCase(),
    role: context.role,
    action: context.action,
    resource: context.resource,
    resourceType: context.resourceType ?? policy.resourceType,
    ipAddress: context.ipAddress,
    region: context.region,
    severity: policy.severity,
    status: policy.status,
    timestamp: new Date(),
  };

  return logRepository.createLog(payload);
}
