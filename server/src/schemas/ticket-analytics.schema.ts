import { Schema, model, Document } from 'mongoose';
import { ITicketAnalytics } from '@common/types';

// Extend the interface with Document for mongoose
export interface ITicketAnalyticsDocument extends ITicketAnalytics, Document {}

const TicketAnalyticsSchema = new Schema<ITicketAnalyticsDocument>({
  externalTicketId: { type: String, required: true, unique: true },
  organization: { type: String, index: true },
  productId: { type: String, index: true },
  
  sentiment: { 
    type: String, 
    enum: ['positive', 'negative', 'neutral'], 
    required: true,
    index: true 
  },
  intents: [{ type: String, index: true }],
  category: { type: String, required: true, index: true },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'medium',
    index: true 
  },
  urgency: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  
  keywords: [String],
  topics: [String],
  language: { type: String, default: 'en' },
  hasAttachments: { type: Boolean, default: false },
  
  createdAt: { type: Date, required: true, index: true },
  resolvedAt: { type: Date, index: true },
  responseTime: Number,
  resolutionTime: Number,
  
  satisfactionRating: { type: Number, min: 1, max: 10 },
  customerFeedback: { 
    type: String, 
    enum: ['positive', 'negative', 'neutral'] 
  },
  
  agentId: String,
  channelSource: { 
    type: String, 
    required: true,
    default: 'web' 
  },
  isEscalated: { type: Boolean, default: false },
  reopenCount: { type: Number, default: 0 },
  
  isComplaint: { type: Boolean, default: false, index: true },
  isFeatureRequest: { type: Boolean, default: false, index: true },
  hasQualityIssue: { type: Boolean, default: false, index: true },
  hasInformationGap: { type: Boolean, default: false, index: true },
  
  // === ADVANCED ANALYTICS ===
  
  // Customer Behavior Insights
  customerJourneyStage: { 
    type: String, 
    enum: ['onboarding', 'active', 'at_risk', 'churning', 'unknown'],
    default: 'unknown',
    index: true
  },
  escalationRisk: { type: Number, min: 0, max: 1, default: 0.5 },
  satisfactionPrediction: { type: Number, min: 1, max: 10, default: 5 },
  isRepeatCustomer: { type: Boolean, default: false, index: true },
  customerSegment: { 
    type: String, 
    enum: ['enterprise', 'smb', 'individual', 'trial'],
    index: true 
  },
  
  // Operational Intelligence
  complexityScore: { type: Number, min: 1, max: 10, default: 5 },
  resolutionPrediction: { type: Number, default: 60 }, // minutes
  agentMatchScore: { type: Map, of: Number, default: {} },
  workloadImpact: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true
  },
  timeToEscalation: Number,
  
  // Business Intelligence
  revenueImpact: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true
  },
  featuresAffected: [String],
  competitorMentioned: { type: Boolean, default: false, index: true },
  competitorNames: [String],
  priceRelated: { type: Boolean, default: false, index: true },
  integrationRelated: { type: Boolean, default: false, index: true },
  
  // Predictive Flags
  likelyToEscalate: { type: Boolean, default: false, index: true },
  churnRisk: { type: Boolean, default: false, index: true },
  upsellOpportunity: { type: Boolean, default: false, index: true },
  requiresSpecialist: { type: Boolean, default: false, index: true },
  
  // Quality Assurance
  documentationGap: { type: Boolean, default: false, index: true },
  knowledgeBaseGap: { type: Boolean, default: false, index: true },
  trainingOpportunity: { type: Boolean, default: false, index: true },
  processImprovement: { type: Boolean, default: false, index: true },
  
  // Communication Analysis
  communicationStyle: { 
    type: String, 
    enum: ['formal', 'casual', 'technical', 'emotional'],
    default: 'casual'
  },
  responseExpectation: { 
    type: String, 
    enum: ['immediate', 'same_day', 'flexible'],
    default: 'same_day'
  },
  preferredTone: { 
    type: String, 
    enum: ['helpful', 'apologetic', 'technical', 'reassuring'],
    default: 'helpful'
  },
  
  // Pattern Recognition
  similarTicketPattern: String,
  seasonalPattern: String,
  behavioralPattern: String,
  
  // Advanced Metrics
  emotionalIntensity: { type: Number, min: 1, max: 10, default: 5 },
  technicalComplexity: { type: Number, min: 1, max: 10, default: 5 },
  businessCriticality: { type: Number, min: 1, max: 10, default: 5 },
  resolutionConfidence: { type: Number, min: 0, max: 1, default: 0.5 },
  
  updatedAt: { type: Date, default: Date.now },
  analyticsVersion: { type: String, default: '1.0' }
});

// Enhanced indexes for advanced analytics
TicketAnalyticsSchema.index({ organization: 1, createdAt: -1 });
TicketAnalyticsSchema.index({ productId: 1, createdAt: -1 });
TicketAnalyticsSchema.index({ sentiment: 1, createdAt: -1 });
TicketAnalyticsSchema.index({ isComplaint: 1, organization: 1 });
TicketAnalyticsSchema.index({ hasQualityIssue: 1, productId: 1 });

// Advanced analytics indexes
TicketAnalyticsSchema.index({ customerJourneyStage: 1, organization: 1 });
TicketAnalyticsSchema.index({ escalationRisk: -1, createdAt: -1 });
TicketAnalyticsSchema.index({ churnRisk: 1, customerSegment: 1 });
TicketAnalyticsSchema.index({ revenueImpact: 1, businessCriticality: -1 });
TicketAnalyticsSchema.index({ competitorMentioned: 1, organization: 1 });
TicketAnalyticsSchema.index({ likelyToEscalate: 1, escalationRisk: -1 });
TicketAnalyticsSchema.index({ documentationGap: 1, topics: 1 });
TicketAnalyticsSchema.index({ workloadImpact: 1, complexityScore: -1 });
TicketAnalyticsSchema.index({ seasonalPattern: 1, createdAt: -1 });
TicketAnalyticsSchema.index({ behavioralPattern: 1, customerSegment: 1 });

export const TicketAnalyticsModel = model<ITicketAnalyticsDocument>('TicketAnalytics', TicketAnalyticsSchema); 