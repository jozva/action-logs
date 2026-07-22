import { randomInt } from 'node:crypto';

import {
  ACTION_POLICIES,
  DEFAULT_ACTION_REGION,
} from '../constants/actions.js';
import * as logRepository from '../repositories/logRepository.js';
import type { ExecuteActionInput } from '../validators/actionValidators.js';
import type { SecurityLogInput } from '../validators/logValidators.js';

function resolveClientIp(fallbackIp?: string, requestIp?: string): string {
  if (fallbackIp) {
    return fallbackIp;
  }

  if (requestIp) {
    const normalized = requestIp.replace(/^::ffff:/, '');
    if (normalized === '::1') {
      return '127.0.0.1';
    }
    return normalized;
  }

  return '127.0.0.1';
}

function buildResourcePath(input: ExecuteActionInput): string {
  if (input.resource) {
    return input.resource;
  }

  const policy = ACTION_POLICIES[input.action];
  const resourceId = input.resourceId ?? String(randomInt(100, 9999));
  return `${policy.resourcePrefix}/${resourceId}`;
}

export async function executeEmployeeAction(
  input: ExecuteActionInput,
  requestIp?: string,
) {
  const policy = ACTION_POLICIES[input.action];

  const logInput: SecurityLogInput = {
    actor: input.actor.toLowerCase(),
    role: input.role,
    action: input.action,
    resource: buildResourcePath(input),
    resourceType: input.resourceType ?? policy.resourceType,
    ipAddress: resolveClientIp(input.ipAddress, requestIp),
    region: input.region ?? DEFAULT_ACTION_REGION,
    severity: policy.severity,
    status: policy.status,
    timestamp: new Date(),
  };

  const log = await logRepository.createLog(logInput);

  return {
    action: input.action,
    description: policy.description,
    note: input.note ?? null,
    auditLog: log,
  };
}

export function listActionCatalog() {
  return Object.entries(ACTION_POLICIES).map(([action, policy]) => ({
    action,
    ...policy,
  }));
}
