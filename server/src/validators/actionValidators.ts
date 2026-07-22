import { z } from 'zod';

import { ACTIONS, ACTOR_ROLES, RESOURCE_TYPES } from '../constants/logs.js';

const ipv4Regex =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
const ipv6Regex = /^[0-9a-fA-F:]+$/;

export const executeActionSchema = z
  .object({
    actor: z.string().trim().email().max(254),
    role: z.enum(ACTOR_ROLES),
    action: z.enum(ACTIONS),
    resourceId: z.string().trim().min(1).max(128).optional(),
    resource: z.string().trim().min(1).max(512).optional(),
    resourceType: z.enum(RESOURCE_TYPES).optional(),
    region: z.string().trim().min(2).max(64).optional(),
    ipAddress: z
      .string()
      .trim()
      .min(3)
      .max(64)
      .refine((value) => ipv4Regex.test(value) || ipv6Regex.test(value), {
        message: 'Invalid IP address',
      })
      .optional(),
    note: z.string().trim().max(280).optional(),
  })
  .strict();

export type ExecuteActionInput = z.infer<typeof executeActionSchema>;
