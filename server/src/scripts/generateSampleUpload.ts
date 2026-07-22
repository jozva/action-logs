import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  ACTIONS,
  ACTOR_ROLES,
  LOG_STATUSES,
  RESOURCE_TYPES,
  SEVERITIES,
} from '../constants/logs.js';

const REGIONS = [
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'ap-south-1',
  'ap-southeast-1',
] as const;

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length] as T;
}

function buildRecord(index: number) {
  const resourceType = pick(RESOURCE_TYPES, index + 1);

  return {
    actor: `operator${(index % 400) + 1}@company.com`,
    role: pick(ACTOR_ROLES, index),
    action: pick(ACTIONS, index + 3),
    resource: `/api/${resourceType.toLowerCase()}s/${(index % 900) + 1}`,
    resourceType,
    ipAddress: `198.51.${Math.floor(index / 255) % 255}.${index % 255}`,
    region: pick(REGIONS, index),
    severity: pick(SEVERITIES, index + 2),
    status: pick(LOG_STATUSES, index + 4),
    timestamp: new Date(Date.now() - index * 1_500).toISOString(),
  };
}

const count = Number(process.argv[2] ?? 1000);
const outputPath = resolve(
  process.cwd(),
  process.argv[3] ?? `sample-upload-${count}.json`,
);

const payload = {
  records: Array.from({ length: count }, (_, index) => buildRecord(index)),
};

writeFileSync(outputPath, JSON.stringify(payload));
console.log(`Wrote ${count} records to ${outputPath}`);
