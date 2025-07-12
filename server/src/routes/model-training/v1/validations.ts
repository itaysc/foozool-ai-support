import { z } from 'zod';

export const trainModelSchema = z.object({
    maxPages: z.number().optional().default(100),
    perPage: z.number().optional().default(100),
    fromPage: z.number().optional().default(1),
});

export type TrainModelInput = z.infer<typeof trainModelSchema>;

// Response schemas
export const trainModelResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  trainingId: z.string(),
  status: z.enum(['started', 'completed', 'failed']),
});
