import type { Request, RequestHandler } from 'express';
import mongoSanitize from 'express-mongo-sanitize';

const sanitizeOptions = {
  replaceWith: '_',
  allowDots: false,
} as const;

function replaceRequestProperty(
  req: Request,
  key: 'query' | 'params',
  value: Record<string, unknown>,
): void {
  Object.defineProperty(req, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

export const sanitizeRequest: RequestHandler = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = mongoSanitize.sanitize(req.body, sanitizeOptions);
  }

  const sanitizedQuery = mongoSanitize.sanitize(
    { ...(req.query as Record<string, unknown>) },
    sanitizeOptions,
  ) as Record<string, unknown>;
  replaceRequestProperty(req, 'query', sanitizedQuery);

  const sanitizedParams = mongoSanitize.sanitize(
    { ...(req.params as Record<string, unknown>) },
    sanitizeOptions,
  ) as Record<string, unknown>;
  replaceRequestProperty(req, 'params', sanitizedParams);

  next();
};
