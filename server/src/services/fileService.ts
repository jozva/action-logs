import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { getCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { BadRequestError, NotFoundError } from '../errors/AppError.js';
import { FileAssetModel } from '../models/FileAsset.js';
import type { AuthenticatedUser } from '../types/auth.js';
import { logger } from '../utils/logger.js';
import { recordAuditEvent } from './auditService.js';

const MAX_FILE_BYTES = 2_000_000;
const uploadsRoot = path.resolve(process.cwd(), 'uploads', 'files');

function mapFile(doc: { _id: unknown } & Record<string, unknown>) {
  const { _id, contentBase64: _content, ...rest } = doc;
  return { id: String(_id), ...rest };
}

function sanitizeStorageSegment(value: string): string {
  return value.replace(/[^\w.\-]+/g, '_').slice(0, 120) || 'file';
}

async function uploadToCloudinary(input: {
  name: string;
  mimeType: string;
  contentBase64: string;
  ownerId: string;
}) {
  const cloudinary = getCloudinary();
  const publicId = `gidy/files/${input.ownerId}/${randomUUID()}-${sanitizeStorageSegment(input.name)}`;
  const dataUri = `data:${input.mimeType};base64,${input.contentBase64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    public_id: publicId,
    resource_type: 'auto',
    overwrite: false,
    unique_filename: false,
  });

  return {
    storageKey: result.public_id,
    cloudinaryPublicId: result.public_id,
    cloudinaryUrl: result.secure_url,
    cloudinaryResourceType: result.resource_type || 'auto',
    bytes: result.bytes || Buffer.from(input.contentBase64, 'base64').byteLength,
  };
}

async function readLocalFallback(storageKey: string, contentBase64?: string) {
  const absolutePath = path.join(uploadsRoot, storageKey);
  try {
    return await fs.readFile(absolutePath);
  } catch {
    if (contentBase64) {
      return Buffer.from(contentBase64, 'base64');
    }
    return null;
  }
}

async function fetchCloudinaryBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new NotFoundError('Cloud file could not be downloaded');
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function listFiles() {
  const files = await FileAssetModel.find()
    .select('-contentBase64')
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  return files.map((file) =>
    mapFile(file as { _id: unknown } & Record<string, unknown>),
  );
}

export async function uploadFile(
  actor: AuthenticatedUser,
  input: {
    name: string;
    mimeType: string;
    sizeBytes: number;
    contentBase64: string;
  },
  meta: { ipAddress: string },
) {
  if (input.sizeBytes > MAX_FILE_BYTES) {
    throw new BadRequestError(`File exceeds ${MAX_FILE_BYTES} byte limit`);
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(input.contentBase64, 'base64');
  } catch {
    throw new BadRequestError('Invalid file content encoding');
  }

  if (buffer.byteLength === 0) {
    throw new BadRequestError('File content is empty');
  }

  if (buffer.byteLength > MAX_FILE_BYTES) {
    throw new BadRequestError(`File exceeds ${MAX_FILE_BYTES} byte limit`);
  }

  let storageKey: string;
  let cloudinaryPublicId: string | undefined;
  let cloudinaryUrl: string | undefined;
  let cloudinaryResourceType: string | undefined;

  if (isCloudinaryConfigured()) {
    try {
      const uploaded = await uploadToCloudinary({
        name: input.name,
        mimeType: input.mimeType,
        contentBase64: input.contentBase64,
        ownerId: actor.id,
      });
      storageKey = uploaded.storageKey;
      cloudinaryPublicId = uploaded.cloudinaryPublicId;
      cloudinaryUrl = uploaded.cloudinaryUrl;
      cloudinaryResourceType = uploaded.cloudinaryResourceType;
    } catch (error) {
      logger.error('Cloudinary upload failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new BadRequestError('Cloud upload failed. Please try again.');
    }
  } else {
    await fs.mkdir(path.join(uploadsRoot, actor.id), { recursive: true });
    storageKey = `${actor.id}/${randomUUID()}-${sanitizeStorageSegment(input.name)}`;
    await fs.writeFile(path.join(uploadsRoot, storageKey), buffer);
  }

  const created = await FileAssetModel.create({
    name: input.name,
    mimeType: input.mimeType,
    sizeBytes: buffer.byteLength,
    ownerId: actor.id,
    ownerEmail: actor.email,
    storageKey,
    cloudinaryPublicId,
    cloudinaryUrl,
    cloudinaryResourceType,
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

export async function getFileForDownload(
  actor: AuthenticatedUser,
  fileId: string,
  meta: { ipAddress: string },
) {
  const file = await FileAssetModel.findById(fileId)
    .select('+contentBase64')
    .lean()
    .exec();
  if (!file) {
    throw new NotFoundError('File not found');
  }

  let buffer: Buffer | null = null;

  if (file.cloudinaryUrl) {
    buffer = await fetchCloudinaryBuffer(String(file.cloudinaryUrl));
  } else {
    buffer = await readLocalFallback(
      String(file.storageKey),
      file.contentBase64 ? String(file.contentBase64) : undefined,
    );
  }

  if (!buffer) {
    throw new NotFoundError(
      'File content is unavailable. Re-upload this file to store it on Cloudinary.',
    );
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
    name: String(file.name),
    mimeType: String(file.mimeType),
    buffer,
  };
}
