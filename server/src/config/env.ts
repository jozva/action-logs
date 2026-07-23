import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

import { ENV_KEYS } from '../constants/env.js';

loadDotenv();

const envSchema = z.object({
  [ENV_KEYS.NODE_ENV]: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  [ENV_KEYS.PORT]: z.coerce.number().int().min(1).max(65535).default(8080),
  [ENV_KEYS.MONGODB_URI]: z.string().min(1, 'MONGODB_URI is required'),
  [ENV_KEYS.CORS_ORIGIN]: z.string().min(1).default('http://localhost:5173'),
  [ENV_KEYS.LOG_LEVEL]: z
    .enum(['error', 'warn', 'info', 'http', 'debug'])
    .default('info'),
  [ENV_KEYS.RATE_LIMIT_WINDOW_MS]: z.coerce
    .number()
    .int()
    .positive()
    .default(900_000),
  [ENV_KEYS.RATE_LIMIT_MAX]: z.coerce.number().int().positive().default(200),
  [ENV_KEYS.UPLOAD_RATE_LIMIT_MAX]: z.coerce
    .number()
    .int()
    .positive()
    .default(10),
  [ENV_KEYS.BODY_LIMIT]: z.string().default('5mb'),
  [ENV_KEYS.UPLOAD_MAX_RECORDS]: z.coerce
    .number()
    .int()
    .positive()
    .max(10_000)
    .default(10_000),
  [ENV_KEYS.JWT_SECRET]: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters')
    .default('gidy-dev-jwt-secret-change-me-32chars'),
  [ENV_KEYS.JWT_EXPIRES_IN]: z.string().default('8h'),
  [ENV_KEYS.CLOUDINARY_URL]: z.string().optional(),
  [ENV_KEYS.CLOUDINARY_CLOUD_NAME]: z.string().optional(),
  [ENV_KEYS.CLOUDINARY_API_KEY]: z.string().optional(),
  [ENV_KEYS.CLOUDINARY_API_SECRET]: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

const data = parsed.data;

export const env = {
  nodeEnv: data.NODE_ENV,
  isProduction: data.NODE_ENV === 'production',
  isDevelopment: data.NODE_ENV === 'development',
  port: data.PORT,
  mongodbUri: data.MONGODB_URI,
  corsOrigins: data.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  logLevel: data.LOG_LEVEL,
  rateLimitWindowMs: data.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: data.RATE_LIMIT_MAX,
  uploadRateLimitMax: data.UPLOAD_RATE_LIMIT_MAX,
  bodyLimit: data.BODY_LIMIT,
  uploadMaxRecords: data.UPLOAD_MAX_RECORDS,
  jwtSecret: data.JWT_SECRET,
  jwtExpiresIn: data.JWT_EXPIRES_IN,
  cloudinaryUrl: data.CLOUDINARY_URL,
  cloudinaryCloudName: data.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: data.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: data.CLOUDINARY_API_SECRET,
} as const;

export type AppEnv = typeof env;
