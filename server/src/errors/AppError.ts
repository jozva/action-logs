import { HTTP_STATUS, type HttpStatusCode } from '../constants/http.js';

export type ErrorDetails = Record<string, unknown> | unknown[] | undefined;

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details: ErrorDetails;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code = 'INTERNAL_ERROR',
    details?: ErrorDetails,
    isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: ErrorDetails) {
    super(message, HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST', details);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details?: ErrorDetails) {
    super(message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED', details);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: ErrorDetails) {
    super(message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN', details);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: ErrorDetails) {
    super(message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: ErrorDetails) {
    super(message, HTTP_STATUS.CONFLICT, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: ErrorDetails) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Payload too large', details?: ErrorDetails) {
    super(message, HTTP_STATUS.PAYLOAD_TOO_LARGE, 'PAYLOAD_TOO_LARGE', details);
    this.name = 'PayloadTooLargeError';
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', details?: ErrorDetails) {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, 'TOO_MANY_REQUESTS', details);
    this.name = 'TooManyRequestsError';
  }
}
