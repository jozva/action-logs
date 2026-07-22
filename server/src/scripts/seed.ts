import { connectDatabase, disconnectDatabase } from '../database/connection.js';
import { SecurityLogModel } from '../models/SecurityLog.js';
import {
  ACTIONS,
  ACTOR_ROLES,
  LOG_STATUSES,
  RESOURCE_TYPES,
  SEVERITIES,
} from '../constants/logs.js';
import { logger } from '../utils/logger.js';

const REGIONS = [
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'ap-south-1',
  'ap-southeast-1',
] as const;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function buildRecord(index: number) {
  const role = pick(ACTOR_ROLES);
  const action = pick(ACTIONS);
  const resourceType = pick(RESOURCE_TYPES);
  const severity = pick(SEVERITIES);
  const status = pick(LOG_STATUSES);
  const region = pick(REGIONS);
  const dayOffset = Math.floor(Math.random() * 30);

  return {
    actor: {
      id: `actor-${(index % 250) + 1}`,
      name: `User ${(index % 250) + 1}`,
      email: `user${(index % 250) + 1}@example.com`,
      role,
    },
    action,
    resource: {
      type: resourceType,
      id: `${resourceType}-${(index % 500) + 1}`,
      name: `${resourceType} resource ${(index % 500) + 1}`,
    },
    severity,
    status,
    ip: `203.0.${Math.floor(index / 256) % 255}.${index % 255}`,
    region,
    userAgent: 'GidySeed/1.0',
    timestamp: new Date(Date.now() - dayOffset * 86_400_000 - index * 1_000),
  };
}

async function seed(): Promise<void> {
  const count = Number(process.argv[2] ?? 1000);
  await connectDatabase();

  const records = Array.from({ length: count }, (_, index) => buildRecord(index));
  await SecurityLogModel.deleteMany({});
  await SecurityLogModel.insertMany(records, { ordered: false });

  logger.info(`Seeded ${count} security logs`);
  await disconnectDatabase();
}

seed().catch(async (error: unknown) => {
  logger.error('Seed failed', {
    message: error instanceof Error ? error.message : 'Unknown seed error',
  });
  await disconnectDatabase();
  process.exit(1);
});
