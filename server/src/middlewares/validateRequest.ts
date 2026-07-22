import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';

import type {
  BulkUploadBody,
  ListLogsQuery,
} from '../validators/logValidators.js';

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validateRequest(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        const parsed = schemas.body.parse(req.body) as BulkUploadBody;
        req.body = parsed;
        req.validatedBody = parsed;
      }

      if (schemas.query) {
        // Express 5 exposes req.query as a getter-only property.
        req.validatedQuery = schemas.query.parse(req.query) as ListLogsQuery;
      }

      if (schemas.params) {
        // Express 5 exposes req.params as a getter-only property.
        req.validatedParams = schemas.params.parse(req.params) as {
          id?: string;
        };
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
