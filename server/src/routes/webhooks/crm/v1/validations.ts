import { z } from 'zod';

export const crmWebhookValidation = z.object({
  crmType: z.string().optional(), // Will be extracted from token type if not provided
  eventType: z.string(),
  ticketId: z.string(),
  subject: z.string(),
  status: z.string(),
  description: z.string(),
  priority: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  created_at: z.string().optional(),
  external_id: z.string(),
  requester: z.object({
    name: z.string().optional(),
    email: z.string().email('Invalid requester email format').optional(),
  }).optional(),
  custom_fields: z.record(z.any()).optional(),
  via: z.string().optional(),
}).passthrough(); // Allow additional fields for different CRMs

export type CRMWebhookInput = z.infer<typeof crmWebhookValidation>;
