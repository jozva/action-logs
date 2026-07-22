import type { Request, Response } from 'express';

import { BadRequestError, UnauthorizedError } from '../errors/AppError.js';
import * as policyService from '../services/policyService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { resolveRequestIp } from '../utils/requestMeta.js';

export async function listPolicies(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new UnauthorizedError();
  const policies = await policyService.listPolicies();
  return sendSuccess(res, policies, 'Policies fetched');
}

export async function updatePolicy(req: Request, res: Response): Promise<Response> {
  if (!req.user) throw new UnauthorizedError();
  const policyId = req.validatedParams?.id;
  const body = req.validatedBody as { enabled: boolean } | undefined;

  if (!policyId || !body || typeof body.enabled !== 'boolean') {
    throw new BadRequestError('Missing policy update payload');
  }

  const policy = await policyService.updatePolicy(req.user, policyId, body.enabled, {
    ipAddress: resolveRequestIp(req),
  });

  return sendSuccess(res, policy, 'Policy updated');
}
