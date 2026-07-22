import type { RequestHandler } from 'express';

import type { Permission } from '../constants/permissions.js';
import { roleHasPermission } from '../constants/permissions.js';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError.js';

export function authorize(...permissions: Permission[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    const allowed = permissions.every((permission) =>
      roleHasPermission(req.user!.role, permission),
    );

    if (!allowed) {
      next(
        new ForbiddenError(
          `Role "${req.user.role}" is not allowed to perform this action`,
        ),
      );
      return;
    }

    next();
  };
}
