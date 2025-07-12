import { z } from 'zod';
import { ZendeskTicket } from 'src/types';
import { EMAIL_REGEX } from '../../../utils/regex';
   
export const newTicket = z.object({
   ticket: z.object({
     id: z.number(),
     subject: z.string(),
     description: z.string(),
     status: z.enum(['new', 'open', 'pending', 'hold', 'solved', 'closed']),
     priority: z.enum(['low', 'normal', 'high', 'urgent']).nullable().optional(),
     type: z.enum(['question', 'incident', 'problem', 'task']).nullable().optional(),
     created_at: z.string(),
     updated_at: z.string(),
     requester_id: z.number(),
     assignee_id: z.number().nullable().optional(),
     organization_id: z.number().nullable().optional(),
     tags: z.array(z.string()),
     custom_fields: z.array(z.object({
       id: z.number(),
       value: z.union([z.string(), z.number(), z.boolean()]).nullable()
     })).optional(),
     via: z.object({
       channel: z.string(),
       source: z.object({
         from: z.record(z.string(), z.unknown()),
         to: z.record(z.string(), z.unknown()),
         rel: z.string().nullable()
       })
     })
   }),
   requester: z.object({
     id: z.number(),
     name: z.string().min(1, 'Requester name is required'),
     email: z.string().min(1, 'Email is required').regex(EMAIL_REGEX, 'Invalid requester email format').optional(),
     phone: z.string().optional(),
     created_at: z.string()
   }),
   assignee: z.object({
     id: z.number(),
     name: z.string().min(1, 'Assignee name is required'),
     email: z.string().min(1, 'Email is required').regex(EMAIL_REGEX, 'Invalid assignee email format').optional()
   }).optional(),
   organization: z.object({
     id: z.number(),
     name: z.string()
   }).optional(),
   event_type: z.enum(['ticket.created', 'ticket.updated'])
});

export type NewTicketInput = z.infer<typeof newTicket>;
    