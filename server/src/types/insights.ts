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
  trend: 'increasing' | 'decreasing' | 'spike' | 'drop';
}

export interface TrendInsight extends BaseInsight {
  category: 'trend';
  trendType: 'support_volume' | 'feature_usage' | 'user_satisfaction';
  direction: 'increasing' | 'decreasing' | 'stable';
  timeFrame: string;
  percentageChange: number;
  affectedProducts?: string[];
}

export interface CustomerSatisfactionInsight extends BaseInsight {
  category: 'customer_satisfaction';
  satisfactionScore: number;
  sentiment: 'positive' | 'negative' | 'neutral';
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