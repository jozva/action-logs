import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/http.js';
import { BadRequestError } from '../errors/AppError.js';
import * as logService from '../services/logService.js';
import { websocketService } from '../services/websocketService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import type {
  BulkUploadBody,
  ListLogsQuery,
} from '../validators/logValidators.js';

export async function listLogs(req: Request, res: Response): Promise<Response> {
  const query = req.validatedQuery as ListLogsQuery | undefined;
  if (!query) {
    throw new BadRequestError('Missing validated query');
  }

  const result = await logService.listLogs(query);
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
  const body = req.validatedBody as BulkUploadBody | undefined;
  if (!body?.records) {
    throw new BadRequestError('Missing upload records');
  }

  const result = await logService.bulkUploadLogs(body.records);

  if (result.validCount > 0) {
    websocketService.broadcastLogEvent('logs:created', {
      logId: 'bulk-upload',
      count: result.validCount,
      timestamp: new Date().toISOString(),
    });
  }

  const message =
    result.invalidCount > 0
      ? 'Bulk upload completed with validation failures'
      : 'Bulk upload completed successfully';

  return sendSuccess(res, result, message, HTTP_STATUS.CREATED);
}
