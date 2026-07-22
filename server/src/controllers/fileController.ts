import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/http.js';
import { BadRequestError, UnauthorizedError } from '../errors/AppError.js';
import * as fileService from '../services/fileService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { resolveRequestIp } from '../utils/requestMeta.js';

export async function listFiles(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new UnauthorizedError();
  const files = await fileService.listFiles();
  return sendSuccess(res, files, 'Files fetched');
}

export async function uploadFile(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new UnauthorizedError();
  const body = req.validatedBody as
    | { name: string; mimeType: string; sizeBytes: number }
    | undefined;
  if (!body) throw new BadRequestError('Missing file payload');

  const file = await fileService.uploadFile(req.user, body, {
    ipAddress: resolveRequestIp(req),
  });

  return sendSuccess(res, file, 'File uploaded', HTTP_STATUS.CREATED);
}

export async function downloadFile(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new UnauthorizedError();
  const fileId = req.validatedParams?.id;
  if (!fileId) throw new BadRequestError('Missing file id');

  const result = await fileService.downloadFile(req.user, fileId, {
    ipAddress: resolveRequestIp(req),
  });

  return sendSuccess(res, result, 'File download authorized');
}
