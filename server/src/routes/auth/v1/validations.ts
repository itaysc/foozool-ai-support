import { z } from 'zod';
import { EMAIL_REGEX } from '../../../utils/regex';
import { registry } from '../../../config/openapi';

export const getToken = z.object({
  email: z.string().regex(EMAIL_REGEX, 'Invalid email format'),
  password: z.string(),
});

export type GetTokenInput = z.infer<typeof getToken>;

// Register schema with OpenAPI
registry.register('GetTokenRequest', getToken);

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

// Register response schemas
registry.register('TokenResponse', tokenResponse);
registry.register('ErrorResponse', errorResponse);
