import type { Response } from 'express';

import { HTTP_STATUS, type HttpStatusCode } from '../constants/http.js';
import type { ApiPagination, ApiSuccessResponse } from '../types/api.js';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode: HttpStatusCode = HTTP_STATUS.OK,
  pagination?: ApiPagination,
): Response {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    message,
    data,
  };

  if (pagination) {
    payload.pagination = pagination;
  }

  return res.status(statusCode).json(payload);
}

export function buildPagination(
  page: number,
  pageSize: number,
  total: number,
): ApiPagination {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}
