export interface ISuccessCriteria {
  primaryMetrics?: Array<{
    name: string;
    currentValue: number;
    targetValue: number;
    unit: string;
    importance: 'critical' | 'high' | 'medium' | 'low';
  }>;
  kpis?: Array<{
    name: string;
    currentValue: number;
    targetValue: number;
    unit: string;
    measurementPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  }>;
  satisfactionBenchmarks?: {
    nps?: {
      current: number;
      target: number;
      lastUpdated: string;
    };
    csat?: {
      current: number;
      target: number;
      lastUpdated: string;
    };
    customMetrics?: Array<{
      name: string;
      current: number;
      target: number;
      scale: string;
      lastUpdated: string;
    }>;
  };
  successDefinition?: string;
  lastUpdated?: string;
}

export interface ICapacityGrowth {
  currentLimits?: {
    storage?: {
      limit: number;
      current: number;
      unit: 'GB' | 'TB';
    };
    users?: {
      limit: number;
      current: number;
      projectedGrowth?: number;
    };
    transactions?: {
      limit: number;
      current: number;
      peakUsage?: number;
    };
    apiCalls?: {
      limit: number;
      current: number;
      projectedGrowth?: number;
    };
  };
  scalingPlans?: {
    nextUpgrade?: {
      plannedDate: string;
      triggerMetric: string;
      triggerThreshold: number;
      upgradeType: 'plan_upgrade' | 'addon' | 'custom';
    };
    growthProjections?: Array<{
      metric: string;
      currentValue: number;
      projectedValue: number;
      timeframe: '3months' | '6months' | '1year';
      confidence: 'high' | 'medium' | 'low';
    }>;
  };
  resourceConstraints?: Array<{
    type: 'budget' | 'technical' | 'personnel' | 'time';
    description: string;
    impact: 'high' | 'medium' | 'low';
    resolutionTimeline?: string;
  }>;
  lastUpdated?: string;
}

export interface ICustomer {
  _id: string;
  organizationId: string;
  name: string;
  logo?: string; // Base64 encoded image or URL
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
  slas?: Array<{ name: string; amount: number; unit: 'minutes' | 'hours' | 'days' }>;
  
  // Success Criteria and KPIs
  successCriteria?: ISuccessCriteria;
  
  // Capacity and Growth Planning
  capacityGrowth?: ICapacityGrowth;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  logo?: string; // Base64 encoded image or URL
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
  slas?: Array<{ name: string; amount: number; unit: 'minutes' | 'hours' | 'days' }>;
  
  // Success Criteria and KPIs
  successCriteria?: ISuccessCriteria;
  
  // Capacity and Growth Planning
  capacityGrowth?: ICapacityGrowth;
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
  slas?: Array<{ name: string; amount: number; unit: 'minutes' | 'hours' | 'days' }>;
  
  // Success Criteria and KPIs
  successCriteria?: ISuccessCriteria;
  
  // Capacity and Growth Planning
  capacityGrowth?: ICapacityGrowth;
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
  sortBy?: 'name' | 'healthScore' | 'startDate' | 'createdAt' | 'updatedAt' | 'contractValue';
  sortOrder?: 'asc' | 'desc';
  industry?: string;
  companySize?: string;
  segment?: 'SMB' | 'Mid-Market' | 'Enterprise' | 'Other';
  accountManager?: string;
  healthScoreMin?: number;
  healthScoreMax?: number;
}
