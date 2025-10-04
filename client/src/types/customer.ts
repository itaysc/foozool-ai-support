export interface ICustomer {
  _id: string;
  organizationId: string;
  name: string;
  industry?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  segment?: 'SMB' | 'Mid-Market' | 'Enterprise' | 'Other';
  startDate?: string;
  accountManager?: string;
  healthScore?: number;
  notes?: string;
  website?: string;
  domains?: string[];
  hq?: { country: string; region?: string; state?: string; city?: string; lat?: number; lon?: number };
  operatingRegions?: string[];
  countriesServed?: string[];
  languages?: string[];
  publicListing?: { isPublic: boolean; ticker?: string; exchange?: string };
  newsKeywords?: string[];
  excludedKeywords?: string[];
  competitorNames?: string[];
  productLines?: string[];
  contentSources?: Array<{ type: 'rss' | 'twitter' | 'news' | 'custom'; handleOrUrl: string; note?: string }>;
  mediaLookbackDaysDefault?: number;
  usageData?: {
    activeUsersCount?: number;
    seatsPurchased?: number;
    seatsUsed?: number;
  };
  // Financial & Business Metrics
  financialMetrics?: {
    annualRecurringRevenue?: number;
    monthlyRecurringRevenue?: number;
    contractRenewalDate?: string; // ISO date string
    contractValue?: number;
    paymentHistory?: Array<{
      date: string; // ISO date string
      amount: number;
      status: 'paid' | 'overdue' | 'pending' | 'failed';
      method?: string;
      invoiceNumber?: string;
    }>;
    creditScore?: number;
    paymentTerms?: 'net15' | 'net30' | 'net60' | 'net90' | 'prepaid' | 'monthly' | 'annual';
    lastPaymentDate?: string; // ISO date string
    outstandingBalance?: number;
    averagePaymentDays?: number;
    paymentReliability?: 'excellent' | 'good' | 'fair' | 'poor';
  };
  stakeholders?: Array<{
    _id?: string;
    name: string;
    title: string;
    department: string;
    role: string;
    stakeholderType: 'primary' | 'secondary' | 'technical' | 'business';
    contact: {
      email: string;
      phone?: string;
      linkedin?: string;
    };
    engagement: {
      level: 'high' | 'medium' | 'low' | 'inactive';
      lastContact?: Date;
      lastLogin?: Date;
      usageRate: number;
    };
    influence: {
      teamSize: number;
      decisionPower: number;
      adoptionInfluence: number;
    };
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  industry?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  segment?: 'SMB' | 'Mid-Market' | 'Enterprise' | 'Other';
  startDate?: string;
  accountManager?: string;
  healthScore?: number;
  notes?: string;
  website?: string;
  domains?: string[];
  hq?: { country: string; region?: string; state?: string; city?: string; lat?: number; lon?: number };
  operatingRegions?: string[];
  countriesServed?: string[];
  languages?: string[];
  publicListing?: { isPublic: boolean; ticker?: string; exchange?: string };
  newsKeywords?: string[];
  excludedKeywords?: string[];
  competitorNames?: string[];
  productLines?: string[];
  contentSources?: Array<{ type: 'rss' | 'twitter' | 'news' | 'custom'; handleOrUrl: string; note?: string }>;
  mediaLookbackDaysDefault?: number;
  usageData?: {
    activeUsersCount?: number;
    seatsPurchased?: number;
    seatsUsed?: number;
  };
  // Financial & Business Metrics
  financialMetrics?: {
    annualRecurringRevenue?: number;
    monthlyRecurringRevenue?: number;
    contractRenewalDate?: string; // ISO date string
    contractValue?: number;
    paymentHistory?: Array<{
      date: string; // ISO date string
      amount: number;
      status: 'paid' | 'overdue' | 'pending' | 'failed';
      method?: string;
      invoiceNumber?: string;
    }>;
    creditScore?: number;
    paymentTerms?: 'net15' | 'net30' | 'net60' | 'net90' | 'prepaid' | 'monthly' | 'annual';
    lastPaymentDate?: string; // ISO date string
    outstandingBalance?: number;
    averagePaymentDays?: number;
    paymentReliability?: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export interface UpdateCustomerRequest {
  name?: string;
  industry?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  segment?: 'SMB' | 'Mid-Market' | 'Enterprise' | 'Other';
  startDate?: string;
  accountManager?: string;
  healthScore?: number;
  notes?: string;
  website?: string;
  domains?: string[];
  hq?: { country: string; region?: string; state?: string; city?: string; lat?: number; lon?: number };
  operatingRegions?: string[];
  countriesServed?: string[];
  languages?: string[];
  publicListing?: { isPublic: boolean; ticker?: string; exchange?: string };
  newsKeywords?: string[];
  excludedKeywords?: string[];
  competitorNames?: string[];
  productLines?: string[];
  contentSources?: Array<{ type: 'rss' | 'twitter' | 'news' | 'custom'; handleOrUrl: string; note?: string }>;
  mediaLookbackDaysDefault?: number;
  usageData?: {
    activeUsersCount?: number;
    seatsPurchased?: number;
    seatsUsed?: number;
  };
  // Financial & Business Metrics
  financialMetrics?: {
    annualRecurringRevenue?: number;
    monthlyRecurringRevenue?: number;
    contractRenewalDate?: string; // ISO date string
    contractValue?: number;
    paymentHistory?: Array<{
      date: string; // ISO date string
      amount: number;
      status: 'paid' | 'overdue' | 'pending' | 'failed';
      method?: string;
      invoiceNumber?: string;
    }>;
    creditScore?: number;
    paymentTerms?: 'net15' | 'net30' | 'net60' | 'net90' | 'prepaid' | 'monthly' | 'annual';
    lastPaymentDate?: string; // ISO date string
    outstandingBalance?: number;
    averagePaymentDays?: number;
    paymentReliability?: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export interface CustomerListResponse {
  customers: ICustomer[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CustomerStats {
  totalCustomers: number;
  averageHealthScore: number;
  customersByIndustry: Array<{ industry: string; count: number }>;
  customersBySize: Array<{ size: string; count: number }>;
  healthScoreDistribution: Array<{ score: number; count: number }>;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'healthScore' | 'startDate' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  industry?: string;
  companySize?: string;
  segment?: 'SMB' | 'Mid-Market' | 'Enterprise' | 'Other';
  accountManager?: string;
  healthScoreMin?: number;
  healthScoreMax?: number;
}
