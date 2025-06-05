export interface IInsight {
  _id?: string;
  
  // Basic insight information
  type: InsightType;
  title: string;
  description: string;
  severity: InsightSeverity;
  status: InsightStatus;
  
  // Analytics data
  confidence: number; // 0-1 score from ML analysis
  frequency: number; // How many times this pattern was detected
  trend: InsightTrend; // Is this increasing, decreasing, or stable
  
  // Associated data
  organization?: string; // Organization this insight relates to
  productId?: string; // Product this insight relates to
  category: InsightCategory;
  tags: string[];
  
  // Evidence and context
  ticketIds: string[]; // Tickets that support this insight
  keywords: string[]; // Key terms detected
  patterns: string[]; // Specific patterns identified
  
  // Temporal data
  firstDetected: Date;
  lastUpdated: Date;
  dateRange: {
    start: Date;
    end: Date;
  };
  
  // Action tracking
  actionRequired: boolean;
  actionTaken?: {
    type: string;
    description: string;
    performedBy: string;
    performedAt: Date;
  };
  
  // Additional metadata for insights
  metadata?: Record<string, any>;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export enum InsightType {
  PRODUCT_COMPLAINT = 'product_complaint',
  INFORMATION_GAP = 'information_gap',
  FEATURE_REQUEST = 'feature_request',
  BUG_PATTERN = 'bug_pattern',
  SATISFACTION_TREND = 'satisfaction_trend',
  SUPPORT_BOTTLENECK = 'support_bottleneck',
  CUSTOMER_BEHAVIOR = 'customer_behavior',
  SEASONAL_PATTERN = 'seasonal_pattern',
  
  // Advanced Customer Behavior Insights
  CHURN_RISK = 'churn_risk',
  ESCALATION_PATTERN = 'escalation_pattern',
  CUSTOMER_JOURNEY_ISSUE = 'customer_journey_issue',
  REPEAT_CUSTOMER_PATTERN = 'repeat_customer_pattern',
  
  // Operational Intelligence
  AGENT_WORKLOAD_IMBALANCE = 'agent_workload_imbalance',
  RESOLUTION_TIME_ANOMALY = 'resolution_time_anomaly',
  COMPLEXITY_SURGE = 'complexity_surge',
  SPECIALIST_DEMAND = 'specialist_demand',
  
  // Business Intelligence
  REVENUE_IMPACT_ALERT = 'revenue_impact_alert',
  FEATURE_ADOPTION_ISSUE = 'feature_adoption_issue',
  COMPETITOR_THREAT = 'competitor_threat',
  PRICING_CONCERN = 'pricing_concern',
  INTEGRATION_BOTTLENECK = 'integration_bottleneck',
  UPSELL_OPPORTUNITY = 'upsell_opportunity',
  
  // Quality Assurance
  DOCUMENTATION_GAP = 'documentation_gap',
  KNOWLEDGE_BASE_GAP = 'knowledge_base_gap',
  TRAINING_OPPORTUNITY = 'training_opportunity',
  PROCESS_IMPROVEMENT = 'process_improvement',
  
  // Communication & Experience
  COMMUNICATION_MISMATCH = 'communication_mismatch',
  RESPONSE_EXPECTATION_GAP = 'response_expectation_gap',
  EMOTIONAL_INTENSITY_SPIKE = 'emotional_intensity_spike',
  
  // Predictive Insights
  SATISFACTION_DECLINE_PREDICTION = 'satisfaction_decline_prediction',
  WORKLOAD_FORECAST_ALERT = 'workload_forecast_alert',
  SEASONAL_SURGE_PREDICTION = 'seasonal_surge_prediction',
  
  // Strategic Insights
  MARKET_FEEDBACK = 'market_feedback',
  PRODUCT_ROADMAP_SIGNAL = 'product_roadmap_signal',
  COMPETITIVE_INTELLIGENCE = 'competitive_intelligence'
}

export enum InsightSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum InsightStatus {
  ACTIVE = 'active',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export enum InsightTrend {
  INCREASING = 'increasing',
  DECREASING = 'decreasing',
  STABLE = 'stable',
  VOLATILE = 'volatile'
}

export enum InsightCategory {
  PRODUCT_QUALITY = 'product_quality',
  DOCUMENTATION = 'documentation',
  USER_EXPERIENCE = 'user_experience',
  TECHNICAL_ISSUES = 'technical_issues',
  BILLING_PAYMENT = 'billing_payment',
  FEATURE_REQUESTS = 'feature_requests',
  CUSTOMER_SATISFACTION = 'customer_satisfaction',
  OPERATIONAL = 'operational',
  
  // Advanced categories
  CUSTOMER_RETENTION = 'customer_retention',
  BUSINESS_INTELLIGENCE = 'business_intelligence',
  COMPETITIVE_ANALYSIS = 'competitive_analysis',
  RESOURCE_OPTIMIZATION = 'resource_optimization',
  QUALITY_ASSURANCE = 'quality_assurance',
  COMMUNICATION_OPTIMIZATION = 'communication_optimization',
  PREDICTIVE_ANALYTICS = 'predictive_analytics',
  STRATEGIC_PLANNING = 'strategic_planning',
  REVENUE_PROTECTION = 'revenue_protection',
  PROCESS_OPTIMIZATION = 'process_optimization'
}

export interface IInsightAnalysisInput {
  ticketId: string;
  subject: string;
  description: string;
  organization?: string;
  productId?: string;
  tags: string[];
  createdAt: Date;
  satisfactionRating?: number;
}

export interface IInsightAnalysisResult {
  insights: Partial<IInsight>[];
  confidence: number;
  recommendations: string[];
} 