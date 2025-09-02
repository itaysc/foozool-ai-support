import { z } from 'zod';

// Validation schemas for customer routes
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  industry: z.string().optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  contractValue: z.number().min(0).optional(),
  startDate: z.string().datetime().optional(),
  accountManager: z.string().optional(),
  healthScore: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  industry: z.string().optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  contractValue: z.number().min(0).optional(),
  startDate: z.string().datetime().optional(),
  accountManager: z.string().optional(),
  healthScore: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

export const getCustomersQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).optional(),
  sortBy: z.enum(['name', 'healthScore', 'contractValue', 'startDate', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  industry: z.string().optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  accountManager: z.string().optional(),
  healthScoreMin: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(10)).optional(),
  healthScoreMax: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(10)).optional(),
});
