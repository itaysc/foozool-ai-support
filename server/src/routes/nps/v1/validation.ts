import { z } from 'zod';

// NPS Question Schema
export const npsQuestionSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  questionType: z.enum(['nps', 'open_text', 'single_select', 'multi_select', 'rating', 'boolean']),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // For select questions
  minValue: z.number().optional(), // For rating questions
  maxValue: z.number().optional(), // For rating questions
  scale: z.number().optional(), // For NPS questions (usually 0-10 or 1-10)
});

// NPS Survey Schema
export const npsSurveySchema = z.object({
  surveyId: z.string().optional(),
  surveyName: z.string().optional(),
  questions: z.array(npsQuestionSchema),
  metadata: z.record(z.any()).optional(),
});

// NPS Response Schema
export const npsResponseSchema = z.object({
  surveyId: z.string().optional(),
  timestamp: z.string().or(z.date()),
  customerId: z.string().optional(),
  responses: z.array(z.object({
    questionId: z.string(),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
    metadata: z.record(z.any()).optional(),
  })),
  context: z.object({
    page: z.string().optional(),
    feature: z.string().optional(),
    userType: z.string().optional(),
    location: z.string().optional(),
    device: z.string().optional(),
    campaign: z.string().optional(),
    source: z.string().optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

// Bulk NPS Import Schema
export const bulkNPSImportSchema = z.object({
  survey: npsSurveySchema,
  responses: z.array(npsResponseSchema),
});

// Export types for use in other files
export type NPSQuestion = z.infer<typeof npsQuestionSchema>;
export type NPSSurvey = z.infer<typeof npsSurveySchema>;
export type NPSResponse = z.infer<typeof npsResponseSchema>;
export type BulkNPSImport = z.infer<typeof bulkNPSImportSchema>;
