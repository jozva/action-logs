import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/http.js';
import * as logService from '../services/logService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import type {
  BulkUploadBody,
  ListLogsQuery,
} from '../validators/logValidators.js';

export async function listLogs(req: Request, res: Response): Promise<Response> {
  const query = req.query as unknown as ListLogsQuery;
  const result = await logService.listLogs(query);
  return sendSuccess(res, result.items, 'Security logs fetched', HTTP_STATUS.OK, result.pagination);
}

export async function getLogById(req: Request, res: Response): Promise<Response> {
  const { id } = req.params as { id: string };
  const log = await logService.getLogById(id);
  return sendSuccess(res, log, 'Security log fetched');
}

export async function getDashboardSummary(
  req: Request,
  res: Response,
): Promise<Response> {
  void req;
  const summary = await logService.getDashboardSummary();
  return sendSuccess(res, summary, 'Dashboard summary fetched');
}

export async function bulkUploadLogs(
  req: Request,
  res: Response,
): Promise<Response> {
  const body = req.body as BulkUploadBody;
  const result = await logService.bulkUploadLogs(body.records);

  const message =
    result.invalidCount > 0
      ? 'Bulk upload completed with validation failures'
      : 'Bulk upload completed successfully';

  return sendSuccess(res, result, message, HTTP_STATUS.CREATED);
}
