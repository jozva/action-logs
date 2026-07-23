import { z } from 'zod';

import { env } from '../config/env.js';
import {
  ACTIONS,
  ACTOR_ROLES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  LOG_SORT_FIELDS,
  LOG_STATUSES,
  MAX_PAGE_SIZE,
  REGIONS,
  RESOURCE_TYPES,
  SEVERITIES,
  SORT_ORDERS,
} from '../constants/logs.js';

const ipv4Regex =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
const ipv6Regex = /^[0-9a-fA-F:]+$/;

const ipSchema = z
  .string()
  .trim()
  .min(3)
  .max(64)
  .refine((value) => ipv4Regex.test(value) || ipv6Regex.test(value), {
    message: 'Invalid IP address',
  });

export const securityLogInputSchema = z
  .object({
    actor: z.string().trim().email().max(254),
    role: z.enum(ACTOR_ROLES),
    action: z.enum(ACTIONS),
    resource: z.string().trim().min(1).max(512),
    resourceType: z.enum(RESOURCE_TYPES),
    ipAddress: ipSchema,
    region: z.string().trim().min(2).max(64),
    severity: z.enum(SEVERITIES),
    status: z.enum(LOG_STATUSES),
    timestamp: z.coerce.date(),
  })
  .strict();

export const bulkUploadSchema = z
  .object({
    records: z
      .array(z.unknown())
      .min(1, 'At least one record is required')
      .max(env.uploadMaxRecords, `Maximum ${env.uploadMaxRecords} records allowed`),
  })
  .strict();

const emptyToUndefined = (value: unknown): unknown =>
  value === '' || value === null || value === undefined ? undefined : value;

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(emptyToUndefined, z.enum(values).optional());

const optionalTrimmedString = (min: number, max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().min(min).max(max).optional(),
  );

const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());

export const listLogsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_PAGE_SIZE)
      .default(DEFAULT_PAGE_SIZE),
    sortBy: z.enum(LOG_SORT_FIELDS).default(DEFAULT_SORT_BY),
    sortOrder: z.enum(SORT_ORDERS).default(DEFAULT_SORT_ORDER),
    search: optionalTrimmedString(1, 128),
    role: optionalEnum(ACTOR_ROLES),
    severity: optionalEnum(SEVERITIES),
    status: optionalEnum(LOG_STATUSES),
    action: optionalEnum(ACTIONS),
    resourceType: optionalEnum(RESOURCE_TYPES),
    region: optionalEnum(REGIONS),
    dateFrom: optionalDate,
    dateTo: optionalDate,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.dateFrom && value.dateTo && value.dateFrom > value.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dateFrom must be before or equal to dateTo',
        path: ['dateFrom'],
      });
    }
  });

export const logIdParamsSchema = z
  .object({
    id: z.string().trim().regex(/^[a-fA-F0-9]{24}$/, 'Invalid log id'),
  })
  .strict();

export type SecurityLogInput = z.infer<typeof securityLogInputSchema>;
export type ListLogsQuery = z.infer<typeof listLogsQuerySchema>;
export type BulkUploadBody = z.infer<typeof bulkUploadSchema>;
