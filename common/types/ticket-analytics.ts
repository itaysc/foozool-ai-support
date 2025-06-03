export interface ITicketAnalytics {
  // Basic identifiers
  externalTicketId: string;
  organization?: string;
  productId?: string;
  
  // Analytics data
  sentiment: 'positive' | 'negative' | 'neutral';
  intents: string[]; // classified intents like 'complaint', 'question', 'request'
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'low' | 'medium' | 'high';
  
  // Content analysis (anonymized)
  keywords: string[]; // extracted keywords without personal info
  topics: string[]; // identified topics/themes
  language: string;
  hasAttachments: boolean;
  
  // Temporal data
  createdAt: Date;
  resolvedAt?: Date;
  responseTime?: number; // minutes to first response
  resolutionTime?: number; // minutes to resolution
  
  // Customer satisfaction
  satisfactionRating?: number; // 1-5 or 1-10 scale
  customerFeedback?: 'positive' | 'negative' | 'neutral';
  
  // Operational metrics
  agentId?: string;
  channelSource: string; // 'email', 'chat', 'phone', 'web'
  isEscalated: boolean;
  reopenCount: number;
  
  // Insight-specific flags
  isComplaint: boolean;
  isFeatureRequest: boolean;
  hasQualityIssue: boolean;
  hasInformationGap: boolean;
  
  // === ADVANCED ANALYTICS ===
  
  // Customer Behavior Insights
  customerJourneyStage: 'onboarding' | 'active' | 'at_risk' | 'churning' | 'unknown';
  escalationRisk: number; // 0-1 probability of escalation
  satisfactionPrediction: number; // 1-10 predicted satisfaction score
  isRepeatCustomer: boolean;
  customerSegment?: 'enterprise' | 'smb' | 'individual' | 'trial';
  
  // Operational Intelligence
  complexityScore: number; // 1-10 complexity rating
  resolutionPrediction: number; // estimated minutes to resolve
  agentMatchScore: Record<string, number>; // agent_id -> fit score (0-1)
  workloadImpact: 'low' | 'medium' | 'high'; // impact on team workload
  timeToEscalation?: number; // minutes before escalation (if escalated)
  
  // Business Intelligence
  revenueImpact: 'low' | 'medium' | 'high' | 'critical';
  featuresAffected: string[]; // product features mentioned
  competitorMentioned: boolean;
  competitorNames: string[]; // anonymized competitor references
  priceRelated: boolean;
  integrationRelated: boolean;
  
  // Predictive Flags
  likelyToEscalate: boolean;
  churnRisk: boolean;
  upsellOpportunity: boolean;
  requiresSpecialist: boolean;
  
  // Quality Assurance
  documentationGap: boolean; // indicates missing docs
  knowledgeBaseGap: boolean; // FAQ/KB gap identified
  trainingOpportunity: boolean; // agent training needed
  processImprovement: boolean; // workflow issue detected
  
  // Communication Analysis
  communicationStyle: 'formal' | 'casual' | 'technical' | 'emotional';
  responseExpectation: 'immediate' | 'same_day' | 'flexible';
  preferredTone: 'helpful' | 'apologetic' | 'technical' | 'reassuring';
  
  // Pattern Recognition
  similarTicketPattern?: string; // pattern ID for grouping
  seasonalPattern?: string; // e.g., "holiday_surge", "end_of_month"
  behavioralPattern?: string; // e.g., "power_user", "confused_new_user"
  
  // Advanced Metrics
  emotionalIntensity: number; // 1-10 emotional intensity in language
  technicalComplexity: number; // 1-10 technical difficulty
  businessCriticality: number; // 1-10 business impact
  resolutionConfidence: number; // 0-1 confidence in resolution
  
  // Metadata
  updatedAt: Date;
  analyticsVersion: string; // for tracking analytics model versions
} 