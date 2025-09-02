import mongoose, { Document, Schema } from 'mongoose';
import { IOrganization } from '../types/organization';

export interface IInsight extends Document {
  clusterId: string;
  organizationId: mongoose.Types.ObjectId | IOrganization;
  insightType: 'ticket_cluster' | 'nps_analysis' | 'customer_satisfaction' | 'trend_analysis' | 'anomaly_detection';
  issueDescription: string;
  ticketVolume: number;
  growthRate: number;
  firstDetectedAt: Date;
  lastUpdatedAt: Date;
  // NPS-specific fields
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
  metadata?: Record<string, any>;
}

const InsightSchema: Schema = new Schema({
  clusterId: { type: String, required: true, unique: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  insightType: { 
    type: String, 
    required: true, 
    enum: ['ticket_cluster', 'nps_analysis', 'customer_satisfaction', 'trend_analysis', 'anomaly_detection'],
    default: 'ticket_cluster'
  },
  issueDescription: { type: String, required: true },
  ticketVolume: { type: Number, required: true },
  growthRate: { type: Number, required: true },
  firstDetectedAt: { type: Date, default: Date.now },
  lastUpdatedAt: { type: Date, default: Date.now },
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
  metadata: { type: Schema.Types.Mixed }
});

// Indexes for better query performance
InsightSchema.index({ organizationId: 1, insightType: 1 }); // Compound index for organization + type queries
InsightSchema.index({ organizationId: 1, lastUpdatedAt: -1 });
InsightSchema.index({ clusterId: 1 });
InsightSchema.index({ insightType: 1, lastUpdatedAt: -1 }); // For insights of specific type

export const InsightModel = mongoose.model<IInsight>('Insight', InsightSchema);