import { randomUUID } from 'node:crypto';

import { SecurityLogModel } from '../models/SecurityLog.js';
import type { AuthenticatedUser } from '../types/auth.js';
import { recordAuditEvent } from './auditService.js';

export async function createDataExport(
  actor: AuthenticatedUser,
  meta: { ipAddress: string },
) {
  const totalLogs = await SecurityLogModel.countDocuments().exec();
  const exportId = randomUUID();

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
    format: 'json',
    recordCount: totalLogs,
    requestedBy: actor.email,
    createdAt: new Date().toISOString(),
    downloadPath: `/api/v1/exports/${exportId}`,
  };
}
