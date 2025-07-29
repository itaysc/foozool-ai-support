import { Schema, model, Document } from 'mongoose';
import { InsightCategory, InsightSeverity } from 'src/types/insights';

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
    required: true,
  },
  severity: {
    type: String,
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
  },
  trendType: {
    type: String,
  },
  direction: {
    type: String,
  },
  percentageChange: Number,
  affectedProducts: [String],
  satisfactionScore: Number,
  sentiment: {
    type: String,
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

// Additional indexes for specific query patterns
insightSchema.index({ createdAt: -1, status: 1 }); // For recent insights with status filter
insightSchema.index({ severity: 1, createdAt: -1 }); // For high priority insights
insightSchema.index({ status: 1, severity: 1 }); // For active high priority insights
insightSchema.index({ category: 1, createdAt: -1 }); // For category-based queries with time
insightSchema.index({ severity: 1, status: 1, createdAt: -1 }); // For dashboard alerts
insightSchema.index({ createdAt: 1 }); // For date range queries (ascending)
insightSchema.index({ updatedAt: -1 }); // For status updates
insightSchema.index({ confidence: -1 }); // For confidence-based sorting
insightSchema.index({ sentiment: 1, createdAt: -1 }); // For sentiment analysis
insightSchema.index({ trend: 1, createdAt: -1 }); // For trend analysis
insightSchema.index({ trendType: 1, createdAt: -1 }); // For trend type analysis
insightSchema.index({ keyTopics: 1 }); // For topic-based searches
insightSchema.index({ satisfactionScore: -1 }); // For satisfaction-based queries

export const InsightModel = model<InsightDocument>('Insight', insightSchema); 