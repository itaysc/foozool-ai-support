import mongoose, { Schema } from 'mongoose';
import { ICustomer } from '../types/customer';

const CustomerSchema: Schema = new Schema<ICustomer>({
  organizationId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    index: true,
  },
  industry: {
    type: String,
    index: true,
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    index: true,
  },
  segment: {
    type: String,
    enum: ['SMB', 'Mid-Market', 'Enterprise', 'Other'],
    index: true,
  },
  contractValue: {
    type: Number,
    min: 0,
    index: true,
  },
  startDate: {
    type: Date,
    index: true,
  },
  accountManager: {
    type: String,
    index: true,
  },
  healthScore: {
    type: Number,
    min: 1,
    max: 10,
    index: true,
  },
  notes: {
    type: String,
  },
  // Media enrichment fields
  website: { type: String },
  domains: [{ type: String }],
  hq: {
    country: { type: String, index: true },
    region: { type: String, index: true },
    state: { type: String },
    city: { type: String },
    lat: { type: Number },
    lon: { type: Number },
  },
  operatingRegions: [{ type: String, index: true }],
  countriesServed: [{ type: String, index: true }],
  languages: [{ type: String }],
  publicListing: {
    isPublic: { type: Boolean, default: false },
    ticker: { type: String, index: true },
    exchange: { type: String },
  },
  newsKeywords: [{ type: String }],
  excludedKeywords: [{ type: String }],
  competitorNames: [{ type: String }],
  productLines: [{ type: String }],
  contentSources: [{
    type: {
      type: String,
      enum: ['rss', 'twitter', 'news', 'custom']
    },
    handleOrUrl: { type: String },
    note: { type: String }
  }],
  mediaLookbackDaysDefault: { type: Number, min: 1 },
  usageData: {
    activeUsersCount: { type: Number, min: 0, index: true },
    seatsPurchased: { type: Number, min: 0 },
    seatsUsed: { type: Number, min: 0 },
  },
  // featureUsage moved to separate collection (FeatureUsage)
}, {
  timestamps: true,
});

// Indexes for better query performance
CustomerSchema.index({ organizationId: 1, createdAt: -1 }); // For chronological ordering by org
CustomerSchema.index({ organizationId: 1, healthScore: -1 }); // For health score filtering
CustomerSchema.index({ organizationId: 1, industry: 1 }); // For industry filtering
CustomerSchema.index({ organizationId: 1, companySize: 1 }); // For company size filtering
CustomerSchema.index({ organizationId: 1, segment: 1 }); // For segment filtering
CustomerSchema.index({ organizationId: 1, accountManager: 1 }); // For account manager filtering

export const CustomerModel = mongoose.model<ICustomer>('Customer', CustomerSchema);
