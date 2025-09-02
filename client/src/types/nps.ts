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

export interface NPSUpload {
  uploadId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

export interface NPSUploadHistory {
  uploads: NPSUpload[];
  total: number;
  limit: number;
  offset: number;
}
