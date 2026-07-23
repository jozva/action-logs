import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/http.js';
import { BadRequestError } from '../errors/AppError.js';
import * as actionService from '../services/actionService.js';
import { websocketService } from '../services/websocketService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  resolveRequestIp,
  resolveRequestRegionMeta,
} from '../utils/requestMeta.js';
import type { ExecuteActionInput } from '../validators/actionValidators.js';

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

  const detected = await resolveRequestRegionMeta(req);
  const result = await actionService.executeEmployeeAction(
    {
      ...body,
      region: body.region ?? detected.region,
      ipAddress: body.ipAddress ?? detected.ipAddress ?? resolveRequestIp(req),
    },
    detected.ipAddress || resolveRequestIp(req),
  );

  websocketService.broadcastLogEvent('logs:created', {
    logId: result.id,
    action: result.action,
    timestamp: result.timestamp,
  });

  return sendSuccess(
    res,
    result,
    `Action ${result.action} executed and audited`,
    HTTP_STATUS.CREATED,
  );
}
