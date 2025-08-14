import { z } from 'zod';
import { EMAIL_REGEX } from '../../../../utils/regex';

export const zendeskWebhookValidation = z.object({
    event_type: z.string(),
    ticket_id: z.string(),
    subject: z.string(),
    status: z.string(),
    description: z.string(),
    priority: z.string().optional(),
    tags: z.union([z.string(), z.array(z.string())]),
    created_at: z.string().optional(),
    external_id: z.string(),
    requester: z.object({
        name: z.string().optional(),
        email: z.string().regex(EMAIL_REGEX, 'Invalid requester email format').optional(),
    }).optional(),
    custom_field_example: z.string().optional(),
    via: z.string().optional(),
});

export type ZendeskWebhookInput = z.infer<typeof zendeskWebhookValidation>;

// Response schemas
export const webhookResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  ticketId: z.string(),
});