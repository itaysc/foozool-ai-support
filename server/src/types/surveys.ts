import { z } from 'zod';

// Survey Types
export type SurveyType = 'nps' | 'csat';

// Base Survey Question Schema
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

// Export types
export type SurveyQuestion = z.infer<typeof surveyQuestionSchema>;
export type Survey = z.infer<typeof surveySchema>;
export type SurveyResponse = z.infer<typeof surveyResponseSchema>;
export type BulkSurveyImport = z.infer<typeof bulkSurveyImportSchema>;

// NPS-specific interfaces
export interface NPSInsights {
  currentNPS: number;
  npsChange: number;
  responseRate: number;
  segmentBreakdown: {
    promoters: number;
    passives: number;
    detractors: number;
  };
  trends: Array<{
    date: Date;
    nps: number;
    responses: number;
  }>;
  insights: string[];
  recommendations: string[];
  totalResponses: number;
  processedAt: Date;
  responseClustering?: {
    clusters: Array<{
      id: string;
      questionId: string;
      questionText: string;
      count: number;
      representativeResponse: string;
      priority: 'high' | 'medium' | 'low';
      insights: string[];
    }>;
    clusteringQuality: 'excellent' | 'good' | 'fair' | 'poor';
    totalClusters: number;
    highPriorityClusters: number;
    mediumPriorityClusters: number;
    lowPriorityClusters: number;
    totalClusteredResponses: number;
    averageClusterSize: number;
  };
}

// CSAT-specific interfaces
export interface CSATInsights {
  currentCSAT: number;
  csatChange: number;
  responseRate: number;
  totalResponses: number;
  averageScores: {
    overall: number;
    product: number;
    support: number;
    onboarding: number;
    value: number;
    relationship: number;
  };
  scoreDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
    terrible: number;
  };
  trends: Array<{
    date: Date;
    csat: number;
    responses: number;
  }>;
  insights: string[];
  recommendations: string[];
  processedAt: Date;
  responseClustering?: {
    clusters: Array<{
      id: string;
      questionId: string;
      questionText: string;
      count: number;
      representativeResponse: string;
      priority: 'high' | 'medium' | 'low';
      insights: string[];
    }>;
    clusteringQuality: 'excellent' | 'good' | 'fair' | 'poor';
    totalClusters: number;
    highPriorityClusters: number;
    mediumPriorityClusters: number;
    lowPriorityClusters: number;
    totalClusteredResponses: number;
    averageClusterSize: number;
  };
}

// Unified survey insights
export type SurveyInsights = NPSInsights | CSATInsights;

export interface ProcessedSurveyData {
  surveyId: string;
  surveyType: SurveyType;
  organizationId: string;
  responses: SurveyResponse[];
  insights: SurveyInsights;
  metadata: Record<string, any>;
}
