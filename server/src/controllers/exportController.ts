import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/http.js';
import { UnauthorizedError } from '../errors/AppError.js';
import * as exportService from '../services/exportService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { resolveRequestIp, resolveRequestRegionMeta } from '../utils/requestMeta.js';

export async function createExport(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new UnauthorizedError();

  const detected = await resolveRequestRegionMeta(req);
  const result = await exportService.createDataExport(req.user, {
    ipAddress: detected.ipAddress || resolveRequestIp(req),
  });

  return sendSuccess(res, result, 'Export created', HTTP_STATUS.CREATED);
}

export async function downloadExport(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();

  const detected = await resolveRequestRegionMeta(req);
  const result = await exportService.createDataExport(req.user, {
    ipAddress: detected.ipAddress || resolveRequestIp(req),
  });

  const body = JSON.stringify(
    {
      exportId: result.exportId,
      format: result.format,
      exportedAt: result.createdAt,
      requestedBy: result.requestedBy,
      recordCount: result.recordCount,
      truncated: result.truncated,
      records: result.records,
    },
    null,
    2,
  );

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${result.filename}"`,
  );
  res.status(HTTP_STATUS.OK).send(body);
}
