import { z } from 'zod';
import { EMAIL_REGEX } from '../../../../utils/regex';
import { registry } from '../../../../config/openapi';

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
        name: z.string().min(1, 'Requester name is required'),
        email: z.string().min(1, 'Email is required').regex(EMAIL_REGEX, 'Invalid requester email format'),
    }),
    custom_field_example: z.string(),
    via: z.string(),
});

export type ZendeskWebhookInput = z.infer<typeof zendeskWebhookValidation>;

// Register schema with OpenAPI
registry.register('ZendeskWebhookRequest', zendeskWebhookValidation);

// Response schemas
export const webhookResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  ticketId: z.string(),
});

// Register response schemas
registry.register('WebhookResponse', webhookResponse);