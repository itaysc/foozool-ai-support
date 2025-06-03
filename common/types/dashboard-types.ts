export interface DashboardFilters {
  organization?: string;
  productId?: string;
  daysBack?: number;
}

export interface OverviewMetrics {
  totalTickets: number;
  avgSatisfaction: number;
  churnRiskCount: number;
  escalationRiskCount: number;
  avgComplexity: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  journeyDistribution: Record<string, number>;
}

export interface ChurnAnalysis {
  totalAtRisk: number;
  bySegment: Record<string, number>;
  avgSatisfaction: number;
}

export interface EscalationAnalysis {
  totalAtRisk: number;
  avgRiskScore: number;
  triggers: string[];
}

export interface JourneyAnalysis {
  stageDistribution: Record<string, number>;
  satisfactionByStage: Record<string, number>;
}

export interface WorkloadAnalysis {
  highImpactTickets: number;
  avgComplexity: number;
  complexityDistribution: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface ResolutionAnalysis {
  avgResolutionTime: number;
  predictedTimes: Array<{
    ticketId: string;
    predicted?: number;
    actual?: number;
  }>;
  bottlenecks: string[];
}

export interface SpecialistAnalysis {
  totalRequiring: number;
  topAreas: string[];
  skillGaps: string[];
}

export interface RevenueAnalysis {
  highImpact: number;
  impactDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  affectedFeatures: string[];
}

export interface CompetitiveAnalysis {
  competitorMentions: number;
  pricingConcerns: number;
  avgSatisfactionPricing: number;
}

export interface UpsellAnalysis {
  totalOpportunities: number;
  estimatedRevenue: number;
  bySegment: Record<string, number>;
}

export interface DocumentationAnalysis {
  gapCount: number;
  knowledgeBaseGaps: number;
  topMissingTopics: string[];
}

export interface TrainingAnalysis {
  opportunityCount: number;
  skillAreas: string[];
  urgencyLevel: string;
}

export interface ProcessAnalysis {
  improvementCount: number;
  inefficiencies: string[];
  automationOpportunities: string[];
}

export interface VolumeForecasting {
  dailyAverage: number;
  trend: string;
  seasonalPatterns: string[];
  nextWeekPrediction: number;
}

export interface SatisfactionForecasting {
  avgCurrent: number;
  trend: string;
  riskFactors: string[];
}

export interface ResourceForecasting {
  specialistHoursNeeded: number;
  expectedComplexity: number;
  capacityWarnings: string[];
}

export interface ActionPlan {
  insightId: string;
  title: string;
  actions: Array<{
    action: string;
    urgency: string;
    owner: string;
  }>;
}

// Composite response interfaces for dashboard endpoints
export interface DashboardOverviewResponse {
  overview: OverviewMetrics;
  insights: {
    total: number;
    critical: number;
    high: number;
    recent: any[];
    confidence: number;
    recommendations: string[];
  };
}

export interface CustomerBehaviorResponse {
  churnAnalysis: ChurnAnalysis;
  escalationAnalysis: EscalationAnalysis;
  journeyAnalysis: JourneyAnalysis;
}

export interface OperationalIntelligenceResponse {
  workloadAnalysis: WorkloadAnalysis;
  resolutionAnalysis: ResolutionAnalysis;
  specialistAnalysis: SpecialistAnalysis;
}

export interface BusinessIntelligenceResponse {
  revenueAnalysis: RevenueAnalysis;
  competitiveAnalysis: CompetitiveAnalysis;
  upsellAnalysis: UpsellAnalysis;
}

export interface QualityInsightsResponse {
  documentationAnalysis: DocumentationAnalysis;
  trainingAnalysis: TrainingAnalysis;
  processAnalysis: ProcessAnalysis;
}

export interface PredictiveAnalyticsResponse {
  volumeForecasting: VolumeForecasting;
  satisfactionForecasting: SatisfactionForecasting;
  resourceForecasting: ResourceForecasting;
}

export interface ActionableInsightsResponse {
  insights: any[];
  recommendations: string[];
  actionPlans: ActionPlan[];
  summary: {
    total: number;
    critical: number;
    high: number;
    avgConfidence: number;
  };
} 