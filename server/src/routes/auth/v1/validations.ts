import { z } from 'zod';
import { EMAIL_REGEX } from '../../../utils/regex';

export const getToken = z.object({
  email: z.string().min(1, 'Email is required').regex(EMAIL_REGEX, 'Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type GetTokenInput = z.infer<typeof getToken>;
