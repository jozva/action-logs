import { ZodError } from 'zod';

import { NotFoundError, ValidationError } from '../errors/AppError.js';
import * as logRepository from '../repositories/logRepository.js';
import { buildPagination } from '../utils/apiResponse.js';
import {
  securityLogInputSchema,
  type ListLogsQuery,
  type SecurityLogInput,
} from '../validators/logValidators.js';

export interface BulkUploadFailure {
  index: number;
  errors: Array<{ path: string; message: string; code: string }>;
}

export interface BulkUploadResult {
  totalReceived: number;
  validCount: number;
  invalidCount: number;
  insertedCount: number;
  failures: BulkUploadFailure[];
}

function formatZodIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || 'root',
    message: issue.message,
    code: issue.code,
  }));
}

export async function listLogs(query: ListLogsQuery) {
  const { items, total } = await logRepository.findLogs(query);

  return {
    items,
    pagination: buildPagination(query.page, query.pageSize, total),
  };
}

export async function getLogById(id: string) {
  const log = await logRepository.findLogById(id);
  if (!log) {
    throw new NotFoundError('Security log not found');
  }
  return log;
}

export async function getDashboardSummary() {
  return logRepository.getDashboardStats();
}

export async function bulkUploadLogs(rawRecords: unknown[]): Promise<BulkUploadResult> {
  const validRecords: SecurityLogInput[] = [];
  const failures: BulkUploadFailure[] = [];

  rawRecords.forEach((record, index) => {
    const parsed = securityLogInputSchema.safeParse(record);
    if (parsed.success) {
      validRecords.push(parsed.data);
      return;
    }

    failures.push({
      index,
      errors: formatZodIssues(parsed.error),
    });
  });

  if (validRecords.length === 0) {
    throw new ValidationError('All records failed validation', {
      totalReceived: rawRecords.length,
      validCount: 0,
      invalidCount: failures.length,
      insertedCount: 0,
      failures: failures.slice(0, 100),
      truncatedFailures: failures.length > 100,
    });
  }

  const { insertedCount } = await logRepository.insertManyLogs(validRecords);

  return {
    totalReceived: rawRecords.length,
    validCount: validRecords.length,
    invalidCount: failures.length,
    insertedCount,
    failures: failures.slice(0, 100),
  };
}
