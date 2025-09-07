export interface ICustomer {
  _id: string;
  organizationId: string;
  name: string;
  industry?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  segment?: 'SMB' | 'Mid-Market' | 'Enterprise' | 'Other';
  contractValue?: number;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  industry?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  segment?: 'SMB' | 'Mid-Market' | 'Enterprise' | 'Other';
  contractValue?: number;
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
}

export interface UpdateCustomerRequest {
  name?: string;
  industry?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  segment?: 'SMB' | 'Mid-Market' | 'Enterprise' | 'Other';
  contractValue?: number;
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
  sortBy?: 'name' | 'healthScore' | 'contractValue' | 'startDate' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  industry?: string;
  companySize?: string;
  segment?: 'SMB' | 'Mid-Market' | 'Enterprise' | 'Other';
  accountManager?: string;
  healthScoreMin?: number;
  healthScoreMax?: number;
}
