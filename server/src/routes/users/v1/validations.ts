import { z } from 'zod';
import { EMAIL_REGEX } from '../../../utils/regex';
import { registry } from '../../../config/openapi';

export const createUserSchema = z.object({
  email: z.string().regex(EMAIL_REGEX, 'Invalid email format'),
  password: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  organization: z.string(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Register schema with OpenAPI
registry.register('CreateUserRequest', createUserSchema);

// Response schemas
export const userResponse = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  organization: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createUserResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  user: userResponse,
});

// Register response schemas
registry.register('UserResponse', userResponse);
registry.register('CreateUserResponse', createUserResponse);
