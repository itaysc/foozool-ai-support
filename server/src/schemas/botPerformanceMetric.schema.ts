import mongoose, { Schema, Document } from 'mongoose';

export interface IBotPerformanceMetric extends Document {
  organization: mongoose.Types.ObjectId;
  date: Date;                        // Daily metrics
  
  // Volume Metrics
  totalTicketsProcessed: number;
  ticketsAutoResolved: number;
  ticketsEscalated: number;
  ticketsWithBotResponse: number;
  
  // Performance Metrics  
  avgResponseTime: number;           // milliseconds
  avgConfidenceScore: number;        // 0-1
  successRate: number;               // percentage (0-100)
  escalationRate: number;            // percentage (0-100)
  
  // Customer Impact
  customerSatisfactionImpact: number;  // average bot feedback score
  avgResolutionTime: number;           // hours
  botResponseAccuracy: number;         // percentage (0-100)
  
  // Business Metrics
  estimatedCostSavings: number;        // USD
  estimatedTimesSaved: number;         // hours
  humanInterventionsAvoided: number;
  
  // Quality Metrics
  falsePositiveRate: number;           // percentage - incorrect auto-resolutions
  falseNegativeRate: number;          // percentage - missed opportunities
  
  // Detailed Breakdowns
  actionBreakdown: {
    refunds: { count: number; successRate: number };
    coupons: { count: number; successRate: number };
    autoReplies: { count: number; successRate: number };
    escalations: { count: number; successRate: number };
    autoResolves: { count: number; successRate: number };
  };
  
  // Trend Data (compared to previous day)
  trends: {
    volumeChange: number;              // percentage change
    successRateChange: number;         // percentage change
    satisfactionChange: number;        // percentage change
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const BotPerformanceMetricSchema: Schema = new Schema<IBotPerformanceMetric>({
  organization: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  
  // Volume Metrics
  totalTicketsProcessed: { 
    type: Number, 
    default: 0 
  },
  ticketsAutoResolved: { 
    type: Number, 
    default: 0 
  },
  ticketsEscalated: { 
    type: Number, 
    default: 0 
  },
  ticketsWithBotResponse: { 
    type: Number, 
    default: 0 
  },
  
  // Performance Metrics
  avgResponseTime: { 
    type: Number, 
    default: 0 
  },
  avgConfidenceScore: { 
    type: Number, 
    min: 0, 
    max: 1, 
    default: 0 
  },
  successRate: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0 
  },
  escalationRate: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0 
  },
  
  // Customer Impact
  customerSatisfactionImpact: { 
    type: Number, 
    min: 1, 
    max: 5, 
    default: 0 
  },
  avgResolutionTime: { 
    type: Number, 
    default: 0 
  },
  botResponseAccuracy: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0 
  },
  
  // Business Metrics
  estimatedCostSavings: { 
    type: Number, 
    default: 0 
  },
  estimatedTimesSaved: { 
    type: Number, 
    default: 0 
  },
  humanInterventionsAvoided: { 
    type: Number, 
    default: 0 
  },
  
  // Quality Metrics
  falsePositiveRate: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0 
  },
  falseNegativeRate: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0 
  },
  
  // Detailed Breakdowns
  actionBreakdown: {
    refunds: {
      count: { type: Number, default: 0 },
      successRate: { type: Number, min: 0, max: 100, default: 0 }
    },
    coupons: {
      count: { type: Number, default: 0 },
      successRate: { type: Number, min: 0, max: 100, default: 0 }
    },
    autoReplies: {
      count: { type: Number, default: 0 },
      successRate: { type: Number, min: 0, max: 100, default: 0 }
    },
    escalations: {
      count: { type: Number, default: 0 },
      successRate: { type: Number, min: 0, max: 100, default: 0 }
    },
    autoResolves: {
      count: { type: Number, default: 0 },
      successRate: { type: Number, min: 0, max: 100, default: 0 }
    }
  },
  
  // Trend Data
  trends: {
    volumeChange: { type: Number, default: 0 },
    successRateChange: { type: Number, default: 0 },
    satisfactionChange: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  collection: 'bot_performance_metrics'
});

// Indexes for efficient querying
BotPerformanceMetricSchema.index({ organization: 1, date: -1 });
BotPerformanceMetricSchema.index({ organization: 1, date: 1 }); // For range queries
BotPerformanceMetricSchema.index({ date: -1 }); // For global trends

// Ensure one metric per organization per day
BotPerformanceMetricSchema.index({ organization: 1, date: 1 }, { unique: true });

export const BotPerformanceMetricModel = mongoose.model<IBotPerformanceMetric>('BotPerformanceMetric', BotPerformanceMetricSchema);