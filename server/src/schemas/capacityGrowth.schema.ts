import { Schema } from 'mongoose';

export const CapacityGrowthSchema = new Schema({
  currentLimits: {
    storage: {
      limit: { type: Number, min: 0 },
      current: { type: Number, min: 0 },
      unit: { type: String, enum: ['GB', 'TB'], default: 'GB' }
    },
    users: {
      limit: { type: Number, min: 0 },
      current: { type: Number, min: 0 },
      projectedGrowth: { type: Number, min: 0 }
    },
    transactions: {
      limit: { type: Number, min: 0 },
      current: { type: Number, min: 0 },
      peakUsage: { type: Number, min: 0 }
    },
    apiCalls: {
      limit: { type: Number, min: 0 },
      current: { type: Number, min: 0 },
      projectedGrowth: { type: Number, min: 0 }
    }
  },
  scalingPlans: {
    nextUpgrade: {
      plannedDate: { type: Date },
      triggerMetric: { type: String },
      triggerThreshold: { type: Number },
      upgradeType: { 
        type: String, 
        enum: ['plan_upgrade', 'addon', 'custom'], 
        default: 'plan_upgrade' 
      }
    },
    growthProjections: [{
      metric: { type: String, required: true },
      currentValue: { type: Number, required: true },
      projectedValue: { type: Number, required: true },
      timeframe: { 
        type: String, 
        enum: ['3months', '6months', '1year'], 
        default: '6months' 
      },
      confidence: { 
        type: String, 
        enum: ['high', 'medium', 'low'], 
        default: 'medium' 
      }
    }]
  },
  resourceConstraints: [{
    type: { 
      type: String, 
      enum: ['budget', 'technical', 'personnel', 'time'], 
      required: true 
    },
    description: { type: String, required: true },
    impact: { 
      type: String, 
      enum: ['high', 'medium', 'low'], 
      default: 'medium' 
    },
    resolutionTimeline: { type: Date }
  }],
  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

export interface ICapacityGrowth {
  currentLimits: {
    storage?: {
      limit: number;
      current: number;
      unit: 'GB' | 'TB';
    };
    users?: {
      limit: number;
      current: number;
      projectedGrowth: number;
    };
    transactions?: {
      limit: number;
      current: number;
      peakUsage: number;
    };
    apiCalls?: {
      limit: number;
      current: number;
      projectedGrowth: number;
    };
  };
  scalingPlans: {
    nextUpgrade?: {
      plannedDate: Date;
      triggerMetric: string;
      triggerThreshold: number;
      upgradeType: 'plan_upgrade' | 'addon' | 'custom';
    };
    growthProjections: Array<{
      metric: string;
      currentValue: number;
      projectedValue: number;
      timeframe: '3months' | '6months' | '1year';
      confidence: 'high' | 'medium' | 'low';
    }>;
  };
  resourceConstraints: Array<{
    type: 'budget' | 'technical' | 'personnel' | 'time';
    description: string;
    impact: 'high' | 'medium' | 'low';
    resolutionTimeline?: Date;
  }>;
  lastUpdated: Date;
}
