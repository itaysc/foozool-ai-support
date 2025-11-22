import { z } from 'zod';

// Shared validators
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID');

// Status enum
export const statusEnum = z.enum(['new', 'in_progress', 'resolved', 'closed', 'reopened']);

// Severity enum
export const severityEnum = z.enum(['critical', 'high', 'medium', 'low']);

// Priority enum
export const priorityEnum = z.enum(['P0', 'P1', 'P2', 'P3', 'P4', 'P5']);

// Params schemas
export const actionItemIdParamSchema = objectIdSchema;
export const customerIdParamSchema = objectIdSchema;
export const insightIdParamSchema = objectIdSchema;
export const commentIdParamSchema = objectIdSchema;

// Query schemas
export const actionItemsQuerySchema = z.object({
  customerId: objectIdSchema.optional(),
  status: statusEnum.optional(),
  assignee: objectIdSchema.optional(),
  priority: priorityEnum.optional(),
  severity: severityEnum.optional(),
});

// Body schema: create action item
export const createActionItemSchema = z.object({
  insightId: objectIdSchema.optional(),
  customerId: objectIdSchema.optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  assignee: objectIdSchema.optional(),
  status: statusEnum.optional().default('new'),
  severity: severityEnum.optional(),
  priority: priorityEnum.optional().default('P2'),
  dueDate: z.union([z.string().datetime(), z.date()]).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Body schema: update action item
export const updateActionItemSchema = z.object({
  assignee: objectIdSchema.optional(),
  status: statusEnum.optional(),
  severity: severityEnum.optional(),
  priority: priorityEnum.optional(),
  dueDate: z.union([z.string().datetime(), z.date()]).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Body schema: update status
export const updateStatusSchema = z.object({
  status: statusEnum,
});

// Body schema: update assignee
export const updateAssigneeSchema = z.object({
  assignee: objectIdSchema.nullable().optional(),
});

// Body schema: update priority
export const updatePrioritySchema = z.object({
  priority: priorityEnum,
});

// Body schema: create action item comment
export const createActionItemCommentSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().min(1).max(2000),
  taggedUserIds: z.array(objectIdSchema).optional(),
});

// Body schema: update action item comment
export const updateActionItemCommentSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  taggedUserIds: z.array(objectIdSchema).optional(),
});
