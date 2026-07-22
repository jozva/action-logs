import type { RequestHandler } from 'express';

import { NotFoundError } from '../errors/AppError.js';

export const notFoundHandler: RequestHandler = (req) => {
  throw new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`);
};
