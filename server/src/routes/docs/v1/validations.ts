import { z } from 'zod';

export const createDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  documentType: z.enum(['meeting_summary', 'note', 'report', 'other']).default('meeting_summary'),
  customerId: z.string().optional(),
  meetingDate: z.date().optional(),
  meetingType: z.enum(['customer_facing', 'internal', 'check_in', 'escalation', 'onboarding', 'renewal', 'other']).optional(),
  duration: z.number().min(0).optional(),
  attendees: z.array(z.string()).optional(),
  notes: z.string().optional(),
  keyPoints: z.array(z.string()).optional(),
  customerSatisfactionScore: z.number().min(1).max(10).optional(),
  tags: z.array(z.string()).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
});
