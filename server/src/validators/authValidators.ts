import { z } from 'zod';

import { ACTOR_ROLES } from '../constants/logs.js';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    password: passwordSchema,
    region: z.string().trim().min(2).max(64).optional().default('ap-south-1'),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(72),
  })
  .strict();

export const createUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    password: passwordSchema,
    role: z.enum(ACTOR_ROLES).default('user'),
    region: z.string().trim().min(2).max(64).default('ap-south-1'),
  })
  .strict();

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    role: z.enum(ACTOR_ROLES).optional(),
    region: z.string().trim().min(2).max(64).optional(),
    status: z.enum(['active', 'disabled']).optional(),
    password: passwordSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const userIdParamsSchema = z
  .object({
    id: z.string().trim().regex(/^[a-fA-F0-9]{24}$/, 'Invalid user id'),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
