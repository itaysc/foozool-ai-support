import { z } from 'zod';

// Survey Question Schema
export const surveyQuestionSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  questionType: z.enum(['nps', 'csat', 'open_text', 'single_select', 'multi_select', 'rating', 'boolean']),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // For select questions
  minValue: z.number().optional(), // For rating questions
  maxValue: z.number().optional(), // For rating questions
  scale: z.number().optional(), // For NPS (0-10) or CSAT (1-5 or 1-10) questions
});

// Survey Schema
export const surveySchema = z.object({
  surveyId: z.string().optional(),
  surveyName: z.string().optional(),
  surveyType: z.enum(['nps', 'csat']),
  questions: z.array(surveyQuestionSchema),
  metadata: z.record(z.any()).optional(),
});

// Survey Response Schema
export const surveyResponseSchema = z.object({
  surveyId: z.string().optional(),
  surveyType: z.enum(['nps', 'csat']).optional(),
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

// Bulk Survey Import Schema
export const bulkSurveyImportSchema = z.object({
  survey: surveySchema,
  responses: z.array(surveyResponseSchema),
});

// Export types for use in other files
export type SurveyQuestion = z.infer<typeof surveyQuestionSchema>;
export type Survey = z.infer<typeof surveySchema>;
export type SurveyResponse = z.infer<typeof surveyResponseSchema>;
export type BulkSurveyImport = z.infer<typeof bulkSurveyImportSchema>;
