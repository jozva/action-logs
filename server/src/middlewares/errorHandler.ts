import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { env } from '../config/env.js';
import { HTTP_STATUS } from '../constants/http.js';
import { AppError } from '../errors/AppError.js';
import type { ApiErrorResponse } from '../types/api.js';
import { logger } from '../utils/logger.js';

function formatZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || 'root',
    message: issue.message,
    code: issue.code,
  }));
}

function resolveError(error: unknown): {
  statusCode: number;
  message: string;
  code: string;
  errors?: unknown;
} {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      errors: error.details,
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: formatZodError(error),
    };
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as { type?: string }).type === 'entity.parse.failed'
  ) {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Malformed JSON payload',
      code: 'MALFORMED_JSON',
    };
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as { type?: string }).type === 'entity.too.large'
  ) {
    return {
      statusCode: HTTP_STATUS.PAYLOAD_TOO_LARGE,
      message: 'Request payload exceeds size limit',
      code: 'PAYLOAD_TOO_LARGE',
    };
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'CastError'
  ) {
    const castError = error as { path?: string; kind?: string; message?: string };
    if (castError.path === 'timestamp' || castError.kind === 'date') {
      return {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Invalid date filter value',
        code: 'INVALID_DATE_FILTER',
      };
    }

    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Invalid identifier format',
      code: 'INVALID_ID',
    };
  }

  return {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  };
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const resolved = resolveError(error);
  const isOperational =
    error instanceof AppError ? error.isOperational : resolved.statusCode < 500;

  if (!isOperational || resolved.statusCode >= 500) {
    logger.error('Unhandled application error', {
      err:
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error,
    });
  } else {
    logger.warn('Operational application error', {
      code: resolved.code,
      message: resolved.message,
      statusCode: resolved.statusCode,
    });
  }

  const payload: ApiErrorResponse = {
    success: false,
    message: resolved.message,
    data: null,
    code: resolved.code,
  };

  if (resolved.errors !== undefined) {
    payload.errors = resolved.errors;
  }

  if (!env.isProduction && error instanceof Error && resolved.statusCode >= 500) {
    payload.errors = {
      name: error.name,
      message: error.message,
    };
  }

  res.status(resolved.statusCode).json(payload);
};
