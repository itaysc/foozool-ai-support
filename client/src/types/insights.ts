export type VolumeTrend = 'increasing' | 'decreasing' | 'stable';
export type SatisfactionTrend = 'increasing' | 'decreasing' | 'stable';
export type TrendType = 'support_volume' | 'feature_usage' | 'user_satisfaction';
export type Sentiment = 'positive' | 'negative' | 'neutral';
export type AnomalyTrend = 'increasing' | 'decreasing' | 'spike' | 'drop';

export type InsightSeverity = 'low' | 'medium' | 'high' | 'critical';

export type InsightCategory = 
  | 'product_feedback'
  | 'missing_documentation'
  | 'potential_bug'
  | 'user_experience'
  | 'feature_request'
  | 'anomaly'
  | 'trend'
  | 'customer_satisfaction';

export interface BaseInsight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  ticketIds: string[];  // References to related tickets
  status: 'active' | 'resolved' | 'archived';
  confidence: number;  // 0-1 score indicating how confident we are in this insight
}

export interface ProductFeedbackInsight extends BaseInsight {
  category: 'product_feedback';
  productId: string;
  feedbackType: 'positive' | 'negative' | 'neutral';
  specificFeature?: string;
}

export interface MissingDocumentationInsight extends BaseInsight {
  category: 'missing_documentation';
  productId: string;
  topic: string;
  suggestedContent: string;
  affectedFeatures: string[];
}

export interface PotentialBugInsight extends BaseInsight {
  category: 'potential_bug';
  productId: string;
  affectedFeature: string;
  reproductionSteps?: string[];
  impact: string;
  frequency: number;  // How many times this issue was reported
}

export interface UserExperienceInsight extends BaseInsight {
  category: 'user_experience';
  productId: string;
  painPoint: string;
  suggestedImprovement: string;
  affectedUserSegment?: string;
}

export interface AnomalyInsight extends BaseInsight {
  category: 'anomaly';
  metric: string;
  expectedValue: number;
  actualValue: number;
  timeFrame: string;
  trend: AnomalyTrend;
}

export interface TrendInsight extends BaseInsight {
  category: 'trend';
  trendType: TrendType;
  direction: VolumeTrend;
  timeFrame: string;
  percentageChange: number;
  affectedProducts?: string[];
}

export interface CustomerSatisfactionInsight extends BaseInsight {
  category: 'customer_satisfaction';
  satisfactionScore: number;
  sentiment: Sentiment;
  keyTopics: string[];
  customerSegment?: string;
}

export type TicketInsight = 
  | ProductFeedbackInsight
  | MissingDocumentationInsight
  | PotentialBugInsight
  | UserExperienceInsight
  | AnomalyInsight
  | TrendInsight
  | CustomerSatisfactionInsight;

export interface InsightAnalysisResult {
  insights: TicketInsight[];
  summary: {
    totalInsights: number;
    highSeverityCount: number;
    categories: Record<InsightCategory, number>;
  };
} 

// --- Analytics Types (moved from qdrantAnalytics.service.ts) ---

export interface TicketAnalytics {
  totalTickets: number;
  timeRange: {
    start: string;
    end: string;
  };
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  intentDistribution: Record<string, number>;
  tagFrequency: Record<string, number>;
  trends: {
    volumeTrend: VolumeTrend;
    satisfactionTrend: SatisfactionTrend;
    percentageChange: number;
  };
  anomalies: Array<{
    type: 'volume_spike' | 'satisfaction_drop' | 'new_intent' | 'sentiment_shift';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  }>;
}

export interface InsightGenerationRequest {
  organizationId: string;
  timeRange?: {
    start: string;
    end: string;
  };
  includeTrends?: boolean;
  includeAnomalies?: boolean;
  includeFuturePredictions?: boolean;
} 

export interface QdrantInsightsResult {
  insights: TicketInsight[];
  analytics: TicketAnalytics;
  summary: {
    totalInsights: number;
    highSeverityCount?: number;
    categories?: Record<InsightCategory, number>;
    message?: string;
  };
}

// --- Dashboard Types ---

export interface UserAgentAnalytics {
  totalTickets: number;
  deviceBreakdown: {
    mobile: { count: number; percentage: number };
    desktop: { count: number; percentage: number };
    tablet: { count: number; percentage: number };
  };
  osBreakdown: Array<{
    os: string;
    count: number;
    percentage: number;
    versions: Array<{ version: string; count: number; percentage: number }>;
  }>;
  browserBreakdown: Array<{
    browser: string;
    count: number;
    percentage: number;
    versions: Array<{ version: string; count: number; percentage: number }>;
  }>;
  topUserAgents: Array<{
    userAgent: string;
    count: number;
    percentage: number;
    device: string;
    os: string;
    browser: string;
  }>;
  anomalies: Array<{
    type: 'os_spike' | 'browser_spike' | 'device_spike' | 'version_issue';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    data: {
      metric: string;
      value: number;
      expectedRange: [number, number];
      affectedTickets: number;
    };
  }>;
  insights: Array<{
    type: 'trend' | 'pattern' | 'recommendation';
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    confidence: number;
    data: Record<string, any>;
  }>;
}

export interface DashboardMetrics {
  totalTickets: number;
  recentTickets: number; // Last 7 days
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topIntents: Array<{ intent: string; count: number; percentage: number }>;
  topTags: Array<{ tag: string; count: number; percentage: number }>;
  volumeTrend: VolumeTrend;
  satisfactionTrend: SatisfactionTrend;
  activeInsights: number;
  highPriorityInsights: number;
  averageResponseTime?: number;
  customerSatisfactionScore?: number;
  userAgentAnalytics?: {
    totalTickets: number;
    deviceBreakdown: {
      mobile: { count: number; percentage: number };
      desktop: { count: number; percentage: number };
      tablet: { count: number; percentage: number };
    };
    topOS: Array<{ os: string; count: number; percentage: number }>;
    topBrowsers: Array<{ browser: string; count: number; percentage: number }>;
  };
}

export interface FuturePrediction {
  title: string;
  prediction: string;
  reasoning: string;
  suggestedActions: string[];
  confidence: 'high' | 'medium' | 'low';
  category: 'ticket_volume' | 'csat' | 'profit_impact' | 'external_event' | 'product_issue' | 'market_change';
  timeframe: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface DashboardInsights {
  futurePredictions: FuturePrediction[];
  trends: Array<{
    title: string;
    description: string;
    trend: string;
    impact: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: string;
    actionItems: string[];
  }>;
}

export interface DashboardAlert {
  id: string;
  type: 'anomaly' | 'trend' | 'threshold' | 'insight';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  actionable: boolean;
}

export interface PerformanceComparison {
  currentPeriod: DashboardMetrics;
  previousPeriod: DashboardMetrics;
  improvements: Array<{ 
    metric: string; 
    change: number; 
    direction: 'improved' | 'declined' 
  }>;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  insights: DashboardInsights;
  alerts: DashboardAlert[];
  performance: PerformanceComparison;
  timeSeriesData?: {
    volumeData: Array<{ date: string; tickets: number }>;
    satisfactionData: Array<{ date: string; satisfaction: number }>;
  };
} 