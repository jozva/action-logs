import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/http.js';
import { BadRequestError } from '../errors/AppError.js';
import * as logService from '../services/logService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function listLogs(req: Request, res: Response): Promise<Response> {
  if (!req.validatedQuery) {
    throw new BadRequestError('Missing validated query');
  }

  const result = await logService.listLogs(req.validatedQuery);
  return sendSuccess(
    res,
    result.items,
    'Security logs fetched',
    HTTP_STATUS.OK,
    result.pagination,
  );
}

export async function getLogById(req: Request, res: Response): Promise<Response> {
  const id = req.validatedParams?.id;
  if (!id) {
    throw new BadRequestError('Missing validated log id');
  }

  const log = await logService.getLogById(id);
  return sendSuccess(res, log, 'Security log fetched');
}

export async function getDashboardSummary(
  _req: Request,
  res: Response,
): Promise<Response> {
  const summary = await logService.getDashboardSummary();
  return sendSuccess(res, summary, 'Dashboard summary fetched');
}

export async function bulkUploadLogs(
  req: Request,
  res: Response,
): Promise<Response> {
  const body = req.validatedBody;
  if (!body || !('records' in body)) {
    throw new BadRequestError('Missing upload records');
  }

  const result = await logService.bulkUploadLogs(body.records);

  const message =
    result.invalidCount > 0
      ? 'Bulk upload completed with validation failures'
      : 'Bulk upload completed successfully';

  return sendSuccess(res, result, message, HTTP_STATUS.CREATED);
}
