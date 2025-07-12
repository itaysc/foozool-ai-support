import { z } from 'zod';
import { EMAIL_REGEX } from '../../../utils/regex';
import { registry } from '../../../config/openapi';

export const createUserSchema = z.object({
  email: z.string().min(1, 'Email is required').regex(EMAIL_REGEX, 'Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  organization: z.string().min(1, 'Organization is required'),
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
