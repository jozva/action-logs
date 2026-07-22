import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/http.js';
import { UnauthorizedError } from '../errors/AppError.js';
import * as exportService from '../services/exportService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { resolveRequestIp } from '../utils/requestMeta.js';

export async function createExport(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new UnauthorizedError();

  const result = await exportService.createDataExport(req.user, {
    ipAddress: resolveRequestIp(req),
  });

  return sendSuccess(res, result, 'Export created', HTTP_STATUS.CREATED);
}
