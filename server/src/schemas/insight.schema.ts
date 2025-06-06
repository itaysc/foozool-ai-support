import { Schema, model, Document } from 'mongoose';
import { InsightCategory, InsightSeverity } from '@common/types/insights';

// Define the document interface
interface InsightDocument extends Document {
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  ticketIds: string[];
  status: 'active' | 'resolved' | 'archived';
  confidence: number;
  // Optional fields
  productId?: string;
  feedbackType?: 'positive' | 'negative' | 'neutral';
  specificFeature?: string;
  topic?: string;
  suggestedContent?: string;
  affectedFeatures?: string[];
  affectedFeature?: string;
  reproductionSteps?: string[];
  impact?: string;
  frequency?: number;
  painPoint?: string;
  suggestedImprovement?: string;
  affectedUserSegment?: string;
  metric?: string;
  expectedValue?: number;
  actualValue?: number;
  timeFrame?: string;
  trend?: 'increasing' | 'decreasing' | 'spike' | 'drop';
  trendType?: 'support_volume' | 'feature_usage' | 'user_satisfaction';
  direction?: 'increasing' | 'decreasing' | 'stable';
  percentageChange?: number;
  affectedProducts?: string[];
  satisfactionScore?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  keyTopics?: string[];
  customerSegment?: string;
}

const insightSchema = new Schema({
  category: {
    type: String,
    enum: [
      'product_feedback',
      'missing_documentation',
      'potential_bug',
      'user_experience',
      'feature_request',
      'anomaly',
      'trend',
      'customer_satisfaction'
    ],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  ticketIds: [{
    type: String,
    required: true,
  }],
  status: {
    type: String,
    enum: ['active', 'resolved', 'archived'],
    default: 'active',
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  // Optional fields
  productId: String,
  feedbackType: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
  },
  specificFeature: String,
  topic: String,
  suggestedContent: String,
  affectedFeatures: [String],
  affectedFeature: String,
  reproductionSteps: [String],
  impact: String,
  frequency: Number,
  painPoint: String,
  suggestedImprovement: String,
  affectedUserSegment: String,
  metric: String,
  expectedValue: Number,
  actualValue: Number,
  timeFrame: String,
  trend: {
    type: String,
    enum: ['increasing', 'decreasing', 'spike', 'drop'],
  },
  trendType: {
    type: String,
    enum: ['support_volume', 'feature_usage', 'user_satisfaction'],
  },
  direction: {
    type: String,
    enum: ['increasing', 'decreasing', 'stable'],
  },
  percentageChange: Number,
  affectedProducts: [String],
  satisfactionScore: Number,
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
  },
  keyTopics: [String],
  customerSegment: String,
}, {
  timestamps: true,
});

// Indexes for better query performance
insightSchema.index({ category: 1, severity: 1 });
insightSchema.index({ ticketIds: 1 });
insightSchema.index({ productId: 1 });
insightSchema.index({ createdAt: -1 });
insightSchema.index({ status: 1 });

export const InsightModel = model<InsightDocument>('Insight', insightSchema); 