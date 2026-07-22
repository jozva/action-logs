import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/http.js';
import { BadRequestError } from '../errors/AppError.js';
import * as actionService from '../services/actionService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import type { ExecuteActionInput } from '../validators/actionValidators.js';

function resolveRequestIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim();
  }
  return req.ip;
}

export async function listActions(
  _req: Request,
  res: Response,
): Promise<Response> {
  const catalog = actionService.listActionCatalog();
  return sendSuccess(res, catalog, 'Employee actions catalog fetched');
}

export async function executeAction(
  req: Request,
  res: Response,
): Promise<Response> {
  const body = req.validatedBody as ExecuteActionInput | undefined;
  if (!body) {
    throw new BadRequestError('Missing validated action payload');
  }

  const result = await actionService.executeEmployeeAction(
    body,
    resolveRequestIp(req),
  );

  return sendSuccess(
    res,
    result,
    `Action ${result.action} executed and audited`,
    HTTP_STATUS.CREATED,
  );
}
