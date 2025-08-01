import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';
import { IOrganization } from 'src/types';

const DashboardSettingsSchema = new Schema({
  analyticsTimeRange: {
    type: {
      type: String,
      enum: ['all_time', 'custom_days', 'custom_months', 'custom_years'],
      default: 'all_time'
    },
    value: { type: Number, min: 1 },
    startDate: { type: String }, // ISO string
    endDate: { type: String } // ISO string
  },
  refreshInterval: {
    enabled: { type: Boolean, default: true },
    minutes: { type: Number, min: 1, max: 1440, default: 30 } // 1 minute to 24 hours
  },
  aggregationSettings: {
    groupBy: {
      type: String,
      enum: ['day', 'week', 'month', 'quarter'],
      default: 'week'
    },
    includeHistoricalData: { type: Boolean, default: true },
    maxDataPoints: { type: Number, min: 10, max: 1000, default: 100 }
  },
  features: {
    showPerformanceComparison: { type: Boolean, default: true },
    showTrendAnalysis: { type: Boolean, default: true },
    showAnomalyDetection: { type: Boolean, default: true },
    showSentimentAnalysis: { type: Boolean, default: true },
    showIntentAnalysis: { type: Boolean, default: true }
  },
  thresholds: {
    criticalTicketVolume: { type: Number, min: 1, default: 100 },
    highPriorityThreshold: { type: Number, min: 1, default: 50 },
    satisfactionAlertThreshold: { type: Number, min: 0, max: 100, default: 70 }
  }
}, { _id: false });

const OrganizationSchema: Schema = new Schema<IOrganization>({
  name: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  signature: { type: String, unique: true, required: true, index: true },
  details: String,
  externalId: String,
  notes: [String],
  tags: [String],
  url: String,
  contact: {
    name: String,
    email: String,
    phone: String,
    notes: String,
  },
  dashboardSettings: {
    type: DashboardSettingsSchema,
    default: () => ({})
  }
}, {
  timestamps: true,
});

// Additional indexes for better query performance
OrganizationSchema.index({ createdAt: -1 }); // For chronological ordering
OrganizationSchema.index({ updatedAt: -1 }); // For recent updates
OrganizationSchema.index({ externalId: 1 }); // For external system lookups
OrganizationSchema.index({ tags: 1 }); // For tag-based filtering

OrganizationSchema.pre('save', async function(next) {
  if (!this.signature) {
      this.signature = crypto.randomBytes(32).toString('hex');
      next();
  }
  next();
});

export const OrganizationModel = mongoose.model<IOrganization>('Organization', OrganizationSchema);


