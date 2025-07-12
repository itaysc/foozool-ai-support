import { z } from 'zod';
import { EMAIL_REGEX } from '../../../../utils/regex';

export const zendeskWebhookValidation = z.object({
    ticket_id: z.string(),
    subject: z.string(),
    status: z.string(),
    description: z.string(),
    priority: z.string(),
    tags: z.string(),
    created_at: z.string(),
    external_id: z.string(),
    requester: z.object({
        name: z.string(),
        email: z.string().regex(EMAIL_REGEX, 'Invalid requester email format'),
    }),
    custom_field_example: z.string(),
    via: z.string(),
});

export type ZendeskWebhookInput = z.infer<typeof zendeskWebhookValidation>;

// Response schemas
export const webhookResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  ticketId: z.string(),
});