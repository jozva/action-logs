import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/http.js';
import { BadRequestError, UnauthorizedError } from '../errors/AppError.js';
import * as fileService from '../services/fileService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { resolveRequestIp, resolveRequestRegionMeta } from '../utils/requestMeta.js';

function buildContentDisposition(filename: string): string {
  const fallback =
    filename
      .normalize('NFKD')
      .replace(/[^\x20-\x7E]/g, '_')
      .replace(/["\\;]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 150) || 'download.bin';

  const encoded = encodeURIComponent(filename)
    .replace(/['()]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/\*/g, '%2A');

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export async function listFiles(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new UnauthorizedError();
  const files = await fileService.listFiles();
  return sendSuccess(res, files, 'Files fetched');
}

export async function uploadFile(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new UnauthorizedError();
  const body = req.validatedBody as
    | {
        name: string;
        mimeType: string;
        sizeBytes: number;
        contentBase64: string;
      }
    | undefined;
  if (!body) throw new BadRequestError('Missing file payload');

  const detected = await resolveRequestRegionMeta(req);
  const file = await fileService.uploadFile(req.user, body, {
    ipAddress: detected.ipAddress || resolveRequestIp(req),
  });

  return sendSuccess(res, file, 'File uploaded', HTTP_STATUS.CREATED);
}

export async function downloadFile(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const fileId = req.validatedParams?.id;
  if (!fileId) throw new BadRequestError('Missing file id');

  const detected = await resolveRequestRegionMeta(req);
  const file = await fileService.getFileForDownload(req.user, fileId, {
    ipAddress: detected.ipAddress || resolveRequestIp(req),
  });

  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', buildContentDisposition(file.name));
  res.setHeader('Content-Length', String(file.buffer.byteLength));
  res.status(HTTP_STATUS.OK).send(file.buffer);
}
