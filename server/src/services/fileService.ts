import { randomUUID } from 'node:crypto';

import { NotFoundError } from '../errors/AppError.js';
import { FileAssetModel } from '../models/FileAsset.js';
import type { AuthenticatedUser } from '../types/auth.js';
import { recordAuditEvent } from './auditService.js';

function mapFile(doc: { _id: unknown } & Record<string, unknown>) {
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export async function listFiles() {
  const files = await FileAssetModel.find().sort({ createdAt: -1 }).lean().exec();
  return files.map((file) =>
    mapFile(file as { _id: unknown } & Record<string, unknown>),
  );
}

export async function uploadFile(
  actor: AuthenticatedUser,
  input: { name: string; mimeType: string; sizeBytes: number; contentBase64?: string },
  meta: { ipAddress: string },
) {
  const created = await FileAssetModel.create({
    name: input.name,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    ownerId: actor.id,
    ownerEmail: actor.email,
    storageKey: `files/${actor.id}/${randomUUID()}-${input.name}`,
  });

  const file = mapFile(created.toObject() as { _id: unknown } & Record<string, unknown>);

  await recordAuditEvent({
    actor: actor.email,
    role: actor.role,
    action: 'UPLOAD_FILE',
    resource: `/api/files/${file.id}`,
    resourceType: 'FILE',
    ipAddress: meta.ipAddress,
    region: actor.region,
  });

  return file;
}

export async function downloadFile(
  actor: AuthenticatedUser,
  fileId: string,
  meta: { ipAddress: string },
) {
  const file = await FileAssetModel.findById(fileId).lean().exec();
  if (!file) {
    throw new NotFoundError('File not found');
  }

  await recordAuditEvent({
    actor: actor.email,
    role: actor.role,
    action: 'DOWNLOAD_FILE',
    resource: `/api/files/${fileId}`,
    resourceType: 'FILE',
    ipAddress: meta.ipAddress,
    region: actor.region,
  });

  return {
    file: mapFile(file as { _id: unknown } & Record<string, unknown>),
    downloadToken: randomUUID(),
    message: 'Download authorized',
  };
}
