import { z } from 'zod';
import { EMAIL_REGEX } from '../../../utils/regex';

export const createUserSchema = z.object({
  email: z.string().min(1, 'Email is required').regex(EMAIL_REGEX, 'Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  organization: z.string().min(1, 'Organization is required'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
