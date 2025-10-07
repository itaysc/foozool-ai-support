import mongoose, { Document, Schema } from 'mongoose';
import { IOrganization } from '../types/organization';

export interface IInsight extends Document {
  clusterId: string;
  insightNumber?: string;
  organizationId: mongoose.Types.ObjectId | IOrganization;
  insightType: 'ticket_cluster' | 'nps_analysis' | 'customer_satisfaction' | 'trend_analysis' | 'anomaly_detection' | 'customer_success';
  issueDescription: string;
  ticketVolume: number;
  growthRate: number;
  firstDetectedAt: Date;
  lastUpdatedAt: Date;
  customerId?: mongoose.Types.ObjectId | string;
  customerName?: string;
  assignee?: mongoose.Types.ObjectId | string;
  status?: 'new' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
  npsData?: {
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
  };
  // CSAT-specific fields
  csatData?: {
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
  };
  metadata?: Record<string, any>;
}

const InsightSchema: Schema = new Schema({
  clusterId: { type: String, required: true, unique: true },
  insightNumber: { type: String, unique: true, sparse: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  insightType: { 
    type: String, 
    required: true, 
    enum: ['ticket_cluster', 'nps_analysis', 'customer_satisfaction', 'trend_analysis', 'anomaly_detection', 'customer_success'],
    default: 'ticket_cluster'
  },
  issueDescription: { type: String, required: true },
  ticketVolume: { type: Number, required: true },
  growthRate: { type: Number, required: true },
  firstDetectedAt: { type: Date, default: Date.now },
  lastUpdatedAt: { type: Date, default: Date.now },
  // Optional linkage to a specific customer for customer success insights
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String },
  // Optional user assigned to handle this insight
  assignee: { type: Schema.Types.ObjectId, ref: 'User' },
  // Status of the insight (Jira-like workflow)
  status: { 
    type: String, 
    enum: ['new', 'in_progress', 'resolved', 'closed', 'reopened'], 
    default: 'new' 
  },
  // NPS-specific fields
  npsData: {
    currentNPS: { type: Number },
    npsChange: { type: Number },
    responseRate: { type: Number },
    segmentBreakdown: {
      promoters: { type: Number },
      passives: { type: Number },
      detractors: { type: Number }
    },
    trends: [{
      date: { type: Date },
      nps: { type: Number },
      responses: { type: Number }
    }],
    insights: [{ type: String }],
    recommendations: [{ type: String }]
  },
  // CSAT-specific fields
  csatData: {
    currentCSAT: { type: Number },
    csatChange: { type: Number },
    responseRate: { type: Number },
    totalResponses: { type: Number },
    averageScores: {
      overall: { type: Number },
      product: { type: Number },
      support: { type: Number },
      onboarding: { type: Number },
      value: { type: Number },
      relationship: { type: Number }
    },
    scoreDistribution: {
      excellent: { type: Number },
      good: { type: Number },
      average: { type: Number },
      poor: { type: Number },
      terrible: { type: Number }
    },
    trends: [{
      date: { type: Date },
      csat: { type: Number },
      responses: { type: Number }
    }],
    insights: [{ type: String }],
    recommendations: [{ type: String }],
    processedAt: { type: Date }
  },
  metadata: { type: Schema.Types.Mixed }
});

// Indexes for better query performance
InsightSchema.index({ organizationId: 1, insightType: 1 });
InsightSchema.index({ organizationId: 1, lastUpdatedAt: -1 });
InsightSchema.index({ clusterId: 1 });
InsightSchema.index({ insightNumber: 1 });
InsightSchema.index({ insightType: 1, lastUpdatedAt: -1 });
InsightSchema.index({ organizationId: 1, customerId: 1, insightType: 1, lastUpdatedAt: -1 });
InsightSchema.index({ assignee: 1, insightType: 1, lastUpdatedAt: -1 }); // For finding insights assigned to a user
InsightSchema.index({ status: 1, insightType: 1, lastUpdatedAt: -1 }); // For finding insights by status

export const InsightModel = mongoose.model<IInsight>('Insight', InsightSchema);