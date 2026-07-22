import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/http.js';
import { BadRequestError, UnauthorizedError } from '../errors/AppError.js';
import * as authService from '../services/authService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { resolveRequestIp, resolveRequestRegion } from '../utils/requestMeta.js';
import type { LoginInput, RegisterInput } from '../validators/authValidators.js';

export async function register(req: Request, res: Response): Promise<Response> {
  const body = req.validatedBody as RegisterInput | undefined;
  if (!body) {
    throw new BadRequestError('Missing registration payload');
  }

  const result = await authService.registerAccount(body, {
    ipAddress: resolveRequestIp(req),
    region: resolveRequestRegion(req, body.region),
  });

  return sendSuccess(res, result, 'Account created successfully', HTTP_STATUS.CREATED);
}

export async function login(req: Request, res: Response): Promise<Response> {
  const body = req.validatedBody as LoginInput | undefined;
  if (!body) {
    throw new BadRequestError('Missing login payload');
  }

  const result = await authService.loginAccount(body, {
    ipAddress: resolveRequestIp(req),
    region: resolveRequestRegion(req),
  });

  return sendSuccess(res, result, 'Logged in successfully');
}

export async function me(req: Request, res: Response): Promise<Response> {
  if (!req.user) {
    throw new UnauthorizedError();
  }

  const user = await authService.getCurrentUser(req.user.id);
  return sendSuccess(res, user, 'Current user fetched');
}

export async function logout(req: Request, res: Response): Promise<Response> {
  if (!req.user) {
    throw new UnauthorizedError();
  }

  const result = await authService.logoutAccount(req.user, {
    ipAddress: resolveRequestIp(req),
  });

  return sendSuccess(res, result, 'Logged out successfully');
}
