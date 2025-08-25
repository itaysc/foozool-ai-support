import mongoose, { Document, Schema } from 'mongoose';
import { IOrganization } from '../types/organization';

export interface IAnomaly extends Document {
  type: 'volume' | 'sentiment' | 'combined';
  severity: 'low' | 'medium' | 'high' | 'critical';
  organizationId: mongoose.Types.ObjectId | IOrganization;
  timestamp: Date;
  description: string;
  metadata: {
    // Volume anomaly specific
    currentValue?: number;
    expectedValue?: number;
    zScore?: number;
    // Sentiment anomaly specific
    currentSentiment?: number;
    baselineSentiment?: number;
    shiftMagnitude?: number;
    // Common
    confidence: number;
    timeWindow: string;
    affectedMetrics: string[];
  };
  status: 'active' | 'acknowledged' | 'resolved' | 'false_positive';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnomalySchema: Schema = new Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['volume', 'sentiment', 'combined'],
    index: true
  },
  severity: { 
    type: String, 
    required: true, 
    enum: ['low', 'medium', 'high', 'critical'],
    index: true
  },
  organizationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  timestamp: { 
    type: Date, 
    required: true, 
    index: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  metadata: {
    currentValue: Number,
    expectedValue: Number,
    zScore: Number,
    currentSentiment: Number,
    baselineSentiment: Number,
    shiftMagnitude: Number,
    confidence: { 
      type: Number, 
      required: true,
      min: 0,
      max: 1
    },
    timeWindow: { 
      type: String, 
      required: true 
    },
    affectedMetrics: [{ 
      type: String 
    }]
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['active', 'acknowledged', 'resolved', 'false_positive'],
    default: 'active',
    index: true
  },
  acknowledgedBy: String,
  acknowledgedAt: Date,
  resolvedBy: String,
  resolvedAt: Date,
  resolutionNotes: String,
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for better query performance
AnomalySchema.index({ organizationId: 1, type: 1, severity: 1 });
AnomalySchema.index({ organizationId: 1, status: 1, createdAt: -1 });
AnomalySchema.index({ severity: 1, status: 1, createdAt: -1 });
AnomalySchema.index({ type: 1, timestamp: -1 });

// Update the updatedAt field on save
AnomalySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for anomaly age
AnomalySchema.virtual('ageInHours').get(function(this: IAnomaly) {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60));
});

// Virtual for time since acknowledgment
AnomalySchema.virtual('timeSinceAcknowledgment').get(function(this: IAnomaly) {
  if (!this.acknowledgedAt) return null;
  return Math.floor((Date.now() - this.acknowledgedAt.getTime()) / (1000 * 60 * 60));
});

// Virtual for time since resolution
AnomalySchema.virtual('timeSinceResolution').get(function(this: IAnomaly) {
  if (!this.resolvedAt) return null;
  return Math.floor((Date.now() - this.resolvedAt.getTime()) / (1000 * 60 * 60));
});

// Static method to get active anomalies by organization
AnomalySchema.statics.getActiveAnomalies = function(organizationId: string) {
  return this.find({ 
    organizationId, 
    status: 'active' 
  }).sort({ severity: -1, createdAt: -1 });
};

// Static method to get anomalies by severity
AnomalySchema.statics.getAnomaliesBySeverity = function(severity: string) {
  return this.find({ severity }).sort({ createdAt: -1 });
};

// Static method to get recent anomalies
AnomalySchema.statics.getRecentAnomalies = function(hours: number = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({ 
    createdAt: { $gte: cutoff } 
  }).sort({ createdAt: -1 });
};

export const AnomalyModel = mongoose.model<IAnomaly>('Anomaly', AnomalySchema);
