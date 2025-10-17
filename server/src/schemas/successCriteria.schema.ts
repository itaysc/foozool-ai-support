import { Schema } from 'mongoose';

export const SuccessCriteriaSchema = new Schema({
  primaryMetrics: [{
    name: { type: String, required: true },
    currentValue: { type: Number, required: true },
    targetValue: { type: Number, required: true },
    unit: { type: String, required: true },
    importance: { 
      type: String, 
      enum: ['critical', 'high', 'medium', 'low'], 
      default: 'medium' 
    }
  }],
  kpis: [{
    name: { type: String, required: true },
    currentValue: { type: Number, required: true },
    targetValue: { type: Number, required: true },
    unit: { type: String, required: true },
    measurementPeriod: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annually'], 
      default: 'monthly' 
    }
  }],
  satisfactionBenchmarks: {
    nps: {
      current: { type: Number, min: -100, max: 100 },
      target: { type: Number, min: -100, max: 100 },
      lastUpdated: { type: Date }
    },
    csat: {
      current: { type: Number, min: 1, max: 5 },
      target: { type: Number, min: 1, max: 5 },
      lastUpdated: { type: Date }
    },
    customMetrics: [{
      name: { type: String, required: true },
      current: { type: Number, required: true },
      target: { type: Number, required: true },
      scale: { type: String, required: true },
      lastUpdated: { type: Date, default: Date.now }
    }]
  },
  successDefinition: { type: String },
  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

export interface ISuccessCriteria {
  primaryMetrics: Array<{
    name: string;
    currentValue: number;
    targetValue: number;
    unit: string;
    importance: 'critical' | 'high' | 'medium' | 'low';
  }>;
  kpis: Array<{
    name: string;
    currentValue: number;
    targetValue: number;
    unit: string;
    measurementPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  }>;
  satisfactionBenchmarks: {
    nps?: {
      current: number;
      target: number;
      lastUpdated: Date;
    };
    csat?: {
      current: number;
      target: number;
      lastUpdated: Date;
    };
    customMetrics: Array<{
      name: string;
      current: number;
      target: number;
      scale: string;
      lastUpdated: Date;
    }>;
  };
  successDefinition?: string;
  lastUpdated: Date;
}
