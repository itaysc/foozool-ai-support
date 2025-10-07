import { z } from 'zod';

// Validation schemas for customer routes
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  industry: z.string().optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  startDate: z.string().datetime().optional(),
  accountManager: z.string().optional(),
  healthScore: z.coerce.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  segment: z.enum(['SMB', 'Mid-Market', 'Enterprise', 'Other']).optional(),
  usageData: z.object({
    activeUsersCount: z.coerce.number().min(0).optional(),
    seatsPurchased: z.coerce.number().min(0).optional(),
    seatsUsed: z.coerce.number().min(0).optional(),
  }).optional(),
  // Geo / Media fields
  website: z.string().optional(),
  domains: z.array(z.string()).optional(),
  hq: z.object({
    country: z.string(),
    region: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    lat: z.number().optional(),
    lon: z.number().optional(),
  }).partial().optional(),
  operatingRegions: z.array(z.string()).optional(),
  countriesServed: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  publicListing: z.object({
    isPublic: z.boolean(),
    ticker: z.string().optional(),
    exchange: z.string().optional(),
  }).partial().optional(),
  newsKeywords: z.array(z.string()).optional(),
  excludedKeywords: z.array(z.string()).optional(),
  competitorNames: z.array(z.string()).optional(),
  productLines: z.array(z.string()).optional(),
  contentSources: z.array(z.object({
    type: z.enum(['rss', 'twitter', 'news', 'custom']).optional(),
    handleOrUrl: z.string(),
    note: z.string().optional(),
  })).optional(),
  mediaLookbackDaysDefault: z.coerce.number().min(1).optional(),
  // Financial & Business Metrics
  financialMetrics: z.object({
    annualRecurringRevenue: z.coerce.number().min(0).optional(),
    monthlyRecurringRevenue: z.coerce.number().min(0).optional(),
    contractRenewalDate: z.string().datetime().optional(),
    contractValue: z.coerce.number().min(0).optional(),
    paymentHistory: z.array(z.object({
      date: z.string().datetime(),
      amount: z.coerce.number().min(0),
      status: z.enum(['paid', 'overdue', 'pending', 'failed']),
      method: z.string().optional(),
      invoiceNumber: z.string().optional(),
    })).optional(),
    creditScore: z.coerce.number().min(300).max(850).optional(),
    paymentTerms: z.enum(['net15', 'net30', 'net60', 'net90', 'prepaid', 'monthly', 'annual']).optional(),
    lastPaymentDate: z.string().datetime().optional(),
    outstandingBalance: z.coerce.number().min(0).optional(),
    averagePaymentDays: z.coerce.number().min(0).optional(),
    paymentReliability: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  }).optional(),
  slas: z.array(z.object({
    name: z.string().min(1),
    amount: z.coerce.number().min(1),
    unit: z.enum(['minutes', 'hours', 'days'])
  })).optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  industry: z.string().optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  startDate: z.string().datetime().optional(),
  accountManager: z.string().optional(),
  healthScore: z.coerce.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  segment: z.enum(['SMB', 'Mid-Market', 'Enterprise', 'Other']).optional(),
  usageData: z.object({
    activeUsersCount: z.coerce.number().min(0).optional(),
    seatsPurchased: z.coerce.number().min(0).optional(),
    seatsUsed: z.coerce.number().min(0).optional(),
  }).optional(),
  website: z.string().optional(),
  domains: z.array(z.string()).optional(),
  hq: z.object({
    country: z.string(),
    region: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    lat: z.number().optional(),
    lon: z.number().optional(),
  }).partial().optional(),
  operatingRegions: z.array(z.string()).optional(),
  countriesServed: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  publicListing: z.object({
    isPublic: z.boolean().optional(),
    ticker: z.string().optional(),
    exchange: z.string().optional(),
  }).optional(),
  newsKeywords: z.array(z.string()).optional(),
  excludedKeywords: z.array(z.string()).optional(),
  competitorNames: z.array(z.string()).optional(),
  productLines: z.array(z.string()).optional(),
  contentSources: z.array(z.object({
    type: z.enum(['rss', 'twitter', 'news', 'custom']).optional(),
    handleOrUrl: z.string(),
    note: z.string().optional(),
  })).optional(),
  mediaLookbackDaysDefault: z.coerce.number().min(1).optional(),
  // Financial & Business Metrics
  financialMetrics: z.object({
    annualRecurringRevenue: z.coerce.number().min(0).optional(),
    monthlyRecurringRevenue: z.coerce.number().min(0).optional(),
    contractRenewalDate: z.string().datetime().optional(),
    contractValue: z.coerce.number().min(0).optional(),
    paymentHistory: z.array(z.object({
      date: z.string().datetime(),
      amount: z.coerce.number().min(0),
      status: z.enum(['paid', 'overdue', 'pending', 'failed']),
      method: z.string().optional(),
      invoiceNumber: z.string().optional(),
    })).optional(),
    creditScore: z.coerce.number().min(300).max(850).optional(),
    paymentTerms: z.enum(['net15', 'net30', 'net60', 'net90', 'prepaid', 'monthly', 'annual']).optional(),
    lastPaymentDate: z.string().datetime().optional(),
    outstandingBalance: z.coerce.number().min(0).optional(),
    averagePaymentDays: z.coerce.number().min(0).optional(),
    paymentReliability: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  }).optional(),
  slas: z.array(z.object({
    name: z.string().min(1),
    amount: z.coerce.number().min(1),
    unit: z.enum(['minutes', 'hours', 'days'])
  })).optional(),
});

export const getCustomersQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).optional(),
  sortBy: z.enum(['name', 'healthScore', 'startDate', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  industry: z.string().optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  segment: z.enum(['SMB', 'Mid-Market', 'Enterprise', 'Other']).optional(),
  accountManager: z.string().optional(),
  healthScoreMin: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(10)).optional(),
  healthScoreMax: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(10)).optional(),
});
