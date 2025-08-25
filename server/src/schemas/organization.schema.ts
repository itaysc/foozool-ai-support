import mongoose, { Schema } from 'mongoose';
import * as crypto from 'crypto';
import { IOrganization } from '../types';

// Dashboard settings schema removed with insights functionality

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
  country: String,
  regions: [String],
  url: String,
  contact: {
    name: String,
    email: String,
    phone: String,
    notes: String,
  },
  crmType: String, // The CRM type this organization uses
  crmConfig: Schema.Types.Mixed, // CRM-specific configuration
  anomalySettings: {
    volumeThreshold: { type: Number, default: 2.5 },
    sentimentThreshold: { type: Number, default: 0.3 },
    timeWindows: {
      short: { type: Number, default: 60 * 60 * 1000 }, // 1 hour
      medium: { type: Number, default: 6 * 60 * 60 * 1000 }, // 6 hours
      long: { type: Number, default: 24 * 60 * 60 * 1000 }, // 24 hours
    },
    minDataPoints: { type: Number, default: 10 },
    enabled: { type: Boolean, default: true },
  },
  // dashboardSettings removed with insights functionality
}, {
  timestamps: true,
});

// Additional indexes for better query performance
OrganizationSchema.index({ createdAt: -1 }); // For chronological ordering
OrganizationSchema.index({ updatedAt: -1 }); // For recent updates
OrganizationSchema.index({ externalId: 1 }); // For external system lookups
OrganizationSchema.index({ tags: 1 }); // For tag-based filtering
OrganizationSchema.index({ crmType: 1 }); // For CRM-based filtering

OrganizationSchema.pre('save', async function(next) {
  if (!this.signature) {
      this.signature = crypto.randomBytes(32).toString('hex');
      next();
  }
  next();
});

export const OrganizationModel = mongoose.model<IOrganization>('Organization', OrganizationSchema);


