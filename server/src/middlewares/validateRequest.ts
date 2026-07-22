import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';

type RequestTarget = 'body' | 'query' | 'params';

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

function assignValidated(
  req: Request,
  target: RequestTarget,
  value: unknown,
): void {
  if (target === 'body') {
    req.body = value;
    return;
  }

  // Express 5 exposes query/params as getters; mutate properties in place.
  Object.keys(req[target] as Record<string, unknown>).forEach((key) => {
    delete (req[target] as Record<string, unknown>)[key];
  });
  Object.assign(req[target] as object, value as object);
}

export function validateRequest(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        assignValidated(req, 'body', schemas.body.parse(req.body));
      }
      if (schemas.query) {
        assignValidated(req, 'query', schemas.query.parse(req.query));
      }
      if (schemas.params) {
        assignValidated(req, 'params', schemas.params.parse(req.params));
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
