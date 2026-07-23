import { randomUUID } from 'node:crypto';

import { SecurityLogModel } from '../models/SecurityLog.js';
import type { AuthenticatedUser } from '../types/auth.js';
import { recordAuditEvent } from './auditService.js';

const EXPORT_PROJECTION = {
  actor: 1,
  role: 1,
  action: 1,
  resource: 1,
  resourceType: 1,
  ipAddress: 1,
  region: 1,
  severity: 1,
  status: 1,
  timestamp: 1,
  createdAt: 1,
} as const;

const MAX_EXPORT_RECORDS = 10_000;

export async function createDataExport(
  actor: AuthenticatedUser,
  meta: { ipAddress: string },
) {
  const logs = await SecurityLogModel.find()
    .select(EXPORT_PROJECTION)
    .sort({ timestamp: -1 })
    .limit(MAX_EXPORT_RECORDS)
    .lean()
    .exec();

  const records = logs.map((log) => {
    const { _id, ...rest } = log as { _id: unknown } & Record<string, unknown>;
    return {
      id: String(_id),
      ...rest,
    };
  });

  const exportId = randomUUID();
  const createdAt = new Date().toISOString();

  await recordAuditEvent({
    actor: actor.email,
    role: actor.role,
    action: 'EXPORT_DATA',
    resource: `/api/exports/${exportId}`,
    resourceType: 'DATABASE',
    ipAddress: meta.ipAddress,
    region: actor.region,
  });

  return {
    exportId,
    format: 'json' as const,
    recordCount: records.length,
    requestedBy: actor.email,
    createdAt,
    truncated: records.length >= MAX_EXPORT_RECORDS,
    records,
    filename: `gidy-security-logs-${createdAt.slice(0, 10)}.json`,
  };
}
