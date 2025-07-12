import { z } from 'zod';

export const trainModelSchema = z.object({
    maxPages: z.number().optional().default(100),
    perPage: z.number().optional().default(100),
    fromPage: z.number().optional().default(1),
});

export type TrainModelInput = z.infer<typeof trainModelSchema>;
