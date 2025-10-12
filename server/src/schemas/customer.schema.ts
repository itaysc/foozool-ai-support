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
  logo: {
    type: String,
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
  stakeholders: [{
    name: { type: String, required: true },
    title: { type: String, required: true },
    department: { type: String, required: true },
    role: { type: String, required: true },
    stakeholderType: { 
      type: String, 
      enum: ['primary', 'secondary', 'technical', 'business'],
      default: 'secondary'
    },
    contact: {
      email: { type: String, required: true },
      phone: { type: String },
      linkedin: { type: String }
    },
    engagement: {
      level: { 
        type: String, 
        enum: ['high', 'medium', 'low', 'inactive'],
        default: 'medium'
      },
      lastContact: { type: Date },
      lastLogin: { type: Date },
      usageRate: { type: Number, min: 0, max: 100, default: 0 }
    },
    influence: {
      teamSize: { type: Number, min: 0, default: 0 },
      decisionPower: { type: Number, min: 1, max: 10, default: 5 },
      adoptionInfluence: { type: Number, min: 1, max: 10, default: 5 }
    },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  // featureUsage moved to separate collection (FeatureUsage)
  
  // Financial & Business Metrics
  financialMetrics: {
    annualRecurringRevenue: { type: Number, min: 0 },
    monthlyRecurringRevenue: { type: Number, min: 0 },
    contractRenewalDate: { type: Date, index: true },
    contractValue: { type: Number, min: 0 }, // This might duplicate existing field
    paymentHistory: [{
      date: { type: Date, required: true },
      amount: { type: Number, required: true },
      status: { 
        type: String, 
        enum: ['paid', 'overdue', 'pending', 'failed'],
        required: true 
      },
      method: { type: String }, // 'credit_card', 'bank_transfer', 'check', etc.
      invoiceNumber: { type: String }
    }],
    creditScore: { type: Number, min: 300, max: 850 },
    paymentTerms: { 
      type: String, 
      enum: ['net15', 'net30', 'net60', 'net90', 'prepaid', 'monthly', 'annual'],
      default: 'net30'
    },
    lastPaymentDate: { type: Date },
    outstandingBalance: { type: Number, min: 0, default: 0 },
    averagePaymentDays: { type: Number, min: 0 }, // Days to pay invoices
    paymentReliability: { 
      type: String, 
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    }
  }
  ,
  // SLA configurations per customer
  slas: [{
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    unit: { type: String, enum: ['minutes', 'hours', 'days'], required: true }
  }]
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
CustomerSchema.index({ organizationId: 1, 'stakeholders.role': 1 }); // For role filtering
CustomerSchema.index({ organizationId: 1, 'stakeholders.engagement.level': 1 }); // For engagement filtering
CustomerSchema.index({ organizationId: 1, 'stakeholders.department': 1 }); // For department filtering
CustomerSchema.index({ organizationId: 1, 'stakeholders.stakeholderType': 1 }); // For stakeholder type filtering

// Financial metrics indexes
CustomerSchema.index({ organizationId: 1, 'financialMetrics.contractRenewalDate': 1 }); // For renewal tracking
CustomerSchema.index({ organizationId: 1, 'financialMetrics.paymentReliability': 1 }); // For payment analysis
CustomerSchema.index({ 'financialMetrics.outstandingBalance': -1 }); // For outstanding balance tracking

export const CustomerModel = mongoose.model<ICustomer>('Customer', CustomerSchema);
