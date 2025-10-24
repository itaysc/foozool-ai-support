import { z } from 'zod';

export const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  company: z.string().max(100, 'Company name must be less than 100 characters').optional(),
  message: z.string().max(1000, 'Message must be less than 1000 characters').optional(),
});

export type CreateLeadRequest = z.infer<typeof createLeadSchema>;
