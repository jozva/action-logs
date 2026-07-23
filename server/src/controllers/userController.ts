import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/http.js';
import { BadRequestError, UnauthorizedError } from '../errors/AppError.js';
import * as userService from '../services/userService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { resolveRequestIp, resolveRequestRegionMeta } from '../utils/requestMeta.js';
import type {
  CreateUserInput,
  UpdateUserInput,
} from '../validators/authValidators.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user;
}

export async function listUsers(req: Request, res: Response): Promise<Response> {
  const actor = requireUser(req);
  const users = await userService.listUsersForActor(actor);
  return sendSuccess(res, users, 'Users fetched');
}

export async function createUser(req: Request, res: Response): Promise<Response> {
  const actor = requireUser(req);
  const body = req.validatedBody as CreateUserInput | undefined;
  if (!body) {
    throw new BadRequestError('Missing user payload');
  }

  const detected = await resolveRequestRegionMeta(req);
  const user = await userService.createUserAsAdmin(actor, body, {
    ipAddress: detected.ipAddress || resolveRequestIp(req),
    region: detected.region,
  });

  return sendSuccess(res, user, 'User created', HTTP_STATUS.CREATED);
}

export async function updateUser(req: Request, res: Response): Promise<Response> {
  const actor = requireUser(req);
  const userId = req.validatedParams?.id;
  const body = req.validatedBody as UpdateUserInput | undefined;

  if (!userId || !body) {
    throw new BadRequestError('Missing user update payload');
  }

  const detected = await resolveRequestRegionMeta(req);
  const user = await userService.updateUserAsActor(actor, userId, body, {
    ipAddress: detected.ipAddress || resolveRequestIp(req),
  });

  return sendSuccess(res, user, 'User updated');
}

export async function deleteUser(req: Request, res: Response): Promise<Response> {
  const actor = requireUser(req);
  const userId = req.validatedParams?.id;
  if (!userId) {
    throw new BadRequestError('Missing user id');
  }

  const detected = await resolveRequestRegionMeta(req);
  const user = await userService.deleteUserAsAdmin(actor, userId, {
    ipAddress: detected.ipAddress || resolveRequestIp(req),
  });

  return sendSuccess(res, user, 'User deleted');
}
