import { z } from 'zod';

/**
 * Validation schema for updating dashboard settings
 */
export const updateDashboardSettingsValidation = z.object({
  analyticsTimeRange: z.object({
    type: z.enum(['all_time', 'custom_days', 'custom_months', 'custom_years']),
    value: z.number().min(1).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
  }).optional(),
  refreshInterval: z.object({
    enabled: z.boolean(),
    minutes: z.number().min(1).max(1440)
  }).optional(),
  aggregationSettings: z.object({
    groupBy: z.enum(['day', 'week', 'month', 'quarter']),
    includeHistoricalData: z.boolean(),
    maxDataPoints: z.number().min(10).max(1000)
  }).optional(),
  features: z.object({
    showPerformanceComparison: z.boolean(),
    showTrendAnalysis: z.boolean(),
    showAnomalyDetection: z.boolean(),
    showSentimentAnalysis: z.boolean(),
    showIntentAnalysis: z.boolean()
  }).optional(),
  thresholds: z.object({
    criticalTicketVolume: z.number().min(1),
    highPriorityThreshold: z.number().min(1),
    satisfactionAlertThreshold: z.number().min(0).max(100)
  }).optional()
});

export type UpdateDashboardSettingsInput = z.infer<typeof updateDashboardSettingsValidation>;



 