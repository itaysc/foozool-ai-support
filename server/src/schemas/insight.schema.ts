import { IInsight, InsightType, InsightSeverity, InsightStatus, InsightTrend, InsightCategory } from '@common/types';
import mongoose, { Schema } from 'mongoose';

// Define action schema separately to avoid type conflicts
const ActionSchema = new Schema({
  type: { type: String },
  description: { type: String },
  performedBy: { type: String },
  performedAt: { type: Date }
}, { _id: false });

const InsightSchema: Schema = new Schema<IInsight>({
  type: { 
    type: String, 
    enum: Object.values(InsightType),
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { 
    type: String, 
    enum: Object.values(InsightSeverity),
    required: true 
  },
  status: { 
    type: String, 
    enum: Object.values(InsightStatus),
    default: InsightStatus.ACTIVE,
    required: true 
  },
  
  // Analytics data
  confidence: { 
    type: Number, 
    required: true,
    min: 0,
    max: 1
  },
  frequency: { 
    type: Number, 
    required: true,
    min: 1 
  },
  trend: { 
    type: String, 
    enum: Object.values(InsightTrend),
    required: true 
  },
  
  // Associated data
  organization: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization' 
  },
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product' 
  },
  category: { 
    type: String, 
    enum: Object.values(InsightCategory),
    required: true 
  },
  tags: { type: [String], default: [] },
  
  // Evidence and context
  ticketIds: { 
    type: [String], 
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v && v.length > 0;
      },
      message: 'At least one ticket ID is required'
    }
  },
  keywords: { type: [String], default: [] },
  patterns: { type: [String], default: [] },
  
  // Temporal data
  firstDetected: { type: Date, required: true },
  lastUpdated: { type: Date, required: true },
  dateRange: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  
  // Action tracking
  actionRequired: { type: Boolean, default: false },
  actionTaken: {
    type: ActionSchema,
    required: false
  }
}, {
  timestamps: true,
  collection: 'insights'
});

// Indexes for better query performance
InsightSchema.index({ type: 1, status: 1 });
InsightSchema.index({ organization: 1, category: 1 });
InsightSchema.index({ productId: 1, severity: 1 });
InsightSchema.index({ 'dateRange.start': 1, 'dateRange.end': 1 });
InsightSchema.index({ confidence: -1, frequency: -1 });

export const InsightModel = mongoose.model<IInsight>('Insight', InsightSchema); 