import {
  ACTIONS,
  ACTOR_ROLES,
  LOG_STATUSES,
  RESOURCE_TYPES,
  SEVERITIES,
} from '../constants/logs.js';
import { connectDatabase, disconnectDatabase } from '../database/connection.js';
import { SecurityLogModel } from '../models/SecurityLog.js';
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
  const resourceType = pick(RESOURCE_TYPES);
  const dayOffset = Math.floor(Math.random() * 30);

  return {
    actor: `user${(index % 250) + 1}@company.com`,
    role: pick(ACTOR_ROLES),
    action: pick(ACTIONS),
    resource: `/api/${resourceType.toLowerCase()}s/${(index % 500) + 1}`,
    resourceType,
    ipAddress: `192.168.${Math.floor(index / 256) % 255}.${index % 255}`,
    region: pick(REGIONS),
    severity: pick(SEVERITIES),
    status: pick(LOG_STATUSES),
    timestamp: new Date(Date.now() - dayOffset * 86_400_000 - index * 1_000),
  };
}

async function seed(): Promise<void> {
  const count = Number(process.argv[2] ?? 1000);
  await connectDatabase();

  await SecurityLogModel.collection.drop().catch(() => undefined);
  await SecurityLogModel.syncIndexes();

  const records = Array.from({ length: count }, (_, index) => buildRecord(index));
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
