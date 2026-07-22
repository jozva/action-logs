import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { permissionsForRole } from '../constants/permissions.js';
import { UnauthorizedError } from '../errors/AppError.js';
import { UserModel } from '../models/User.js';
import type { AuthenticatedUser } from '../types/auth.js';
import { verifyAuthToken } from '../utils/jwt.js';

export const authenticate: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing bearer token');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedError('Missing bearer token');
    }

    const payload = verifyAuthToken(token);
    const user = await UserModel.findById(payload.sub).lean().exec();

    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('Account is inactive or does not exist');
    }

    const role = user.role as AuthenticatedUser['role'];
    const status = user.status as AuthenticatedUser['status'];

    req.user = {
      id: String(user._id),
      email: String(user.email),
      name: String(user.name),
      role,
      region: String(user.region),
      status,
      permissions: permissionsForRole(role),
    };

    next();
  } catch (error) {
    next(error);
  }
};
