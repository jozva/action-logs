import type { SortOrder as MongooseSortOrder } from 'mongoose';

import type { LogSortField, SortOrder } from '../constants/logs.js';
import { SecurityLogModel } from '../models/SecurityLog.js';
import type { ListLogsQuery, SecurityLogInput } from '../validators/logValidators.js';

type LogFilter = Record<string, unknown>;

const LIST_PROJECTION = {
  actor: 1,
  action: 1,
  resource: 1,
  severity: 1,
  status: 1,
  ip: 1,
  region: 1,
  userAgent: 1,
  timestamp: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;

export interface ListLogsResult {
  items: Array<Record<string, unknown>>;
  total: number;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSort(
  sortBy: LogSortField,
  sortOrder: SortOrder,
): Record<string, MongooseSortOrder> {
  const direction: MongooseSortOrder = sortOrder === 'asc' ? 1 : -1;
  return { [sortBy]: direction, _id: direction };
}

export function buildLogFilter(query: ListLogsQuery): LogFilter {
  const filter: LogFilter = {};

  if (query.role) {
    filter['actor.role'] = query.role;
  }
  if (query.severity) {
    filter.severity = query.severity;
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.action) {
    filter.action = query.action;
  }
  if (query.resourceType) {
    filter['resource.type'] = query.resourceType;
  }
  if (query.region) {
    filter.region = query.region;
  }

  if (query.dateFrom || query.dateTo) {
    filter.timestamp = {
      ...(query.dateFrom ? { $gte: query.dateFrom } : {}),
      ...(query.dateTo ? { $lte: query.dateTo } : {}),
    };
  }

  const search = query.search?.trim();
  if (search) {
    const escaped = escapeRegex(search);
    const regex = new RegExp(escaped, 'i');
    filter.$or = [
      { 'actor.name': regex },
      { 'actor.email': regex },
      { action: regex },
      { 'resource.name': regex },
      { 'resource.id': regex },
      { ip: regex },
      { region: regex },
      { status: regex },
    ];
  }

  return filter;
}

export async function findLogs(
  query: ListLogsQuery,
): Promise<ListLogsResult> {
  const filter = buildLogFilter(query);
  const sort = buildSort(query.sortBy, query.sortOrder);
  const skip = (query.page - 1) * query.pageSize;

  const [items, total] = await Promise.all([
    SecurityLogModel.find(filter)
      .select(LIST_PROJECTION)
      .sort(sort)
      .skip(skip)
      .limit(query.pageSize)
      .lean()
      .exec(),
    SecurityLogModel.countDocuments(filter).exec(),
  ]);

  return {
    items: items.map((item) => {
      const { _id, ...rest } = item as { _id: unknown } & Record<string, unknown>;
      return { id: String(_id), ...rest };
    }),
    total,
  };
}

export async function findLogById(id: string): Promise<Record<string, unknown> | null> {
  const item = await SecurityLogModel.findById(id)
    .select(LIST_PROJECTION)
    .lean()
    .exec();

  if (!item) {
    return null;
  }

  const { _id, ...rest } = item as { _id: unknown } & Record<string, unknown>;
  return { id: String(_id), ...rest };
}

const BULK_INSERT_CHUNK_SIZE = 1_000;

export async function insertManyLogs(
  records: SecurityLogInput[],
): Promise<{ insertedCount: number }> {
  if (records.length === 0) {
    return { insertedCount: 0 };
  }

  let insertedCount = 0;

  for (let index = 0; index < records.length; index += BULK_INSERT_CHUNK_SIZE) {
    const chunk = records.slice(index, index + BULK_INSERT_CHUNK_SIZE);
    const result = await SecurityLogModel.insertMany(chunk, {
      ordered: false,
      lean: true,
    });
    insertedCount += result.length;
  }

  return { insertedCount };
}

export async function getDashboardStats(): Promise<{
  total: number;
  bySeverity: Array<{ severity: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
}> {
  const [total, bySeverity, byStatus] = await Promise.all([
    SecurityLogModel.estimatedDocumentCount().exec(),
    SecurityLogModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).exec(),
    SecurityLogModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).exec(),
  ]);

  return {
    total,
    bySeverity: bySeverity.map((row) => ({
      severity: row._id,
      count: row.count,
    })),
    byStatus: byStatus.map((row) => ({
      status: row._id,
      count: row.count,
    })),
  };
}
