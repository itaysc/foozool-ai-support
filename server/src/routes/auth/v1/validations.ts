import { z } from 'zod';
import { EMAIL_REGEX } from '../../../utils/regex';

export const getToken = z.object({
  email: z.string().regex(EMAIL_REGEX, 'Invalid email format'),
  password: z.string(),
});

export type GetTokenInput = z.infer<typeof getToken>;

// Response schemas
export const tokenResponse = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.string(),
});

export const errorResponse = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
});


