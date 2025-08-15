import { z } from 'zod';

export const crmValidation = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  configSchema: z.record(z.any()),
  webhookConfig: z.object({
    supportedEvents: z.array(z.string()),
    payloadSchema: z.record(z.any()),
    headersSchema: z.record(z.any()),
  }),
  apiConfig: z.object({
    baseUrl: z.string().url('Invalid base URL'),
    authenticationType: z.enum(['basic', 'bearer', 'oauth2', 'api_key']),
    requiredHeaders: z.array(z.string()),
  }),
});

export const crmUpdateValidation = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  type: z.string().min(1, 'Type is required').optional(),
  displayName: z.string().min(1, 'Display name is required').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  configSchema: z.record(z.any()).optional(),
  webhookConfig: z.object({
    supportedEvents: z.array(z.string()),
    payloadSchema: z.record(z.any()),
    headersSchema: z.record(z.any()),
  }).optional(),
  apiConfig: z.object({
    baseUrl: z.string().url('Invalid base URL'),
    authenticationType: z.enum(['basic', 'bearer', 'oauth2', 'api_key']),
    requiredHeaders: z.array(z.string()),
  }).optional(),
});

export const crmConfigValidation = z.object({
  crmType: z.string().min(1, 'CRM type is required'),
  config: z.record(z.any()),
});

export type CRMInput = z.infer<typeof crmValidation>;
export type CRMUpdateInput = z.infer<typeof crmUpdateValidation>;
export type CRMConfigInput = z.infer<typeof crmConfigValidation>;
