import { z } from 'zod';

// Shared validators
export const objectIdRegex = /^[0-9a-fA-F]{24}$/;
export const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ID');

// Body schema: create a new insight comment
export const createInsightCommentSchema = z.object({
  title: z.string().max(200).optional().default(''),
  description: z.string().min(1).max(2000),
  taggedUserIds: z.array(z.string().regex(objectIdRegex, 'Invalid User ID')).optional()
});

// Body schema: update an existing insight comment
export const updateInsightCommentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  taggedUserIds: z.array(z.string().regex(objectIdRegex, 'Invalid User ID')).optional()
});

// Params schemas
export const insightIdParamSchema = objectIdSchema;
export const commentIdParamSchema = objectIdSchema;
export const userIdParamSchema = objectIdSchema;
export const insightNumberParamSchema = z.string().min(1);


