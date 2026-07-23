import { z } from 'zod';

export const uploadFileSchema = z
  .object({
    name: z.string().trim().min(1).max(180),
    mimeType: z.string().trim().min(3).max(120),
    sizeBytes: z.coerce.number().int().min(1).max(2_000_000),
    contentBase64: z
      .string()
      .min(1, 'File content is required')
      .max(3_000_000, 'Encoded file content is too large'),
  })
  .strict();

export const updatePolicySchema = z
  .object({
    enabled: z.boolean(),
  })
  .strict();

export const resourceIdParamsSchema = z
  .object({
    id: z.string().trim().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id'),
  })
  .strict();
