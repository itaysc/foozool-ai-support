import mongoose, { Document, Schema } from 'mongoose';
import { IOrganization } from '../types/organization';

export interface IInsight extends Document {
  clusterId: string;
  organizationId: mongoose.Types.ObjectId | IOrganization;
  issueDescription: string;
  ticketVolume: number;
  growthRate: number;
  firstDetectedAt: Date;
  lastUpdatedAt: Date;
}

const InsightSchema: Schema = new Schema({
  clusterId: { type: String, required: true, unique: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  issueDescription: { type: String, required: true },
  ticketVolume: { type: Number, required: true },
  growthRate: { type: Number, required: true },
  firstDetectedAt: { type: Date, default: Date.now },
  lastUpdatedAt: { type: Date, default: Date.now },
});

// Index for better query performance
InsightSchema.index({ organizationId: 1, lastUpdatedAt: -1 });
InsightSchema.index({ clusterId: 1 });

export const InsightModel = mongoose.model<IInsight>('Insight', InsightSchema);