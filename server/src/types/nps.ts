import { NPSResponse } from '../routes/nps/v1/validation';

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

export interface ProcessedNPSData {
  surveyId: string;
  organizationId: string;
  responses: NPSResponse[];
  insights: NPSInsights;
  metadata: Record<string, any>;
}

// Re-export types from validation for convenience
export type { NPSSurvey, NPSResponse, BulkNPSImport } from '../routes/nps/v1/validation';
