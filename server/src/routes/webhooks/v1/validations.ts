import z from "zod";

export const createWebhookSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    url: z.string().url('Valid URL is required'),
    events: z.array(z.string()).min(1, 'At least one event is required'),
    isActive: z.boolean().optional(),
    maxRetries: z.number().min(0).max(10).optional(),
    timeout: z.number().min(1000).max(60000).optional(),
    headers: z.record(z.string()).optional()
  });
  
  export const updateWebhookSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    url: z.string().url().optional(),
    events: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    maxRetries: z.number().min(0).max(10).optional(),
    timeout: z.number().min(1000).max(60000).optional(),
    headers: z.record(z.string()).optional()
  });