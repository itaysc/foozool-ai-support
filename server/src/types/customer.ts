export interface StakeholderData {
  name: string;
  title: string;
  department: string;
  role: string;
  stakeholderType?: 'primary' | 'secondary' | 'technical' | 'business';
  contact: {
    email: string;
    phone?: string;
    linkedin?: string;
  };
  engagement?: {
    level?: 'high' | 'medium' | 'low' | 'inactive';
    lastContact?: string; // ISO date string
    lastLogin?: string; // ISO date string
    usageRate?: number;
  };
  influence?: {
    teamSize?: number;
    decisionPower?: number;
    adoptionInfluence?: number;
  };
  notes?: string;
}

export interface ICustomer {
  _id?: string;
  organizationId: string; // Multi-tenancy: which organization owns this customer
  name: string;
  industry?: string;
  companySize?: string; // e.g., "1-10", "11-50", "51-200", "201-500", "500+"
  segment?: string; // e.g., SMB, Mid-Market, Enterprise
  contractValue?: number;
  startDate?: Date;
  accountManager?: string; // Name of the account manager/CSM
  healthScore?: number; // 1-10 scale
  notes?: string;
  usageData?: {
    activeUsersCount?: number;
    seatsPurchased?: number;
    seatsUsed?: number;
  };
  featureUsage?: Array<{
    feature: string;
    activeUsersCount?: number;
    utilizationPercent?: number;
  }>;
  // Media/insights enrichment fields
  website?: string;
  domains?: string[];
  hq?: { country: string; region?: string; state?: string; city?: string; lat?: number; lon?: number };
  operatingRegions?: string[]; // e.g., ["US", "EU", "APAC"]
  countriesServed?: string[];
  languages?: string[]; // preferred content languages
  publicListing?: { isPublic: boolean; ticker?: string; exchange?: string };
  newsKeywords?: string[];
  excludedKeywords?: string[];
  competitorNames?: string[];
  productLines?: string[];
  contentSources?: Array<{ type: 'rss' | 'twitter' | 'news' | 'custom'; handleOrUrl: string; note?: string }>;
  mediaLookbackDaysDefault?: number;
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
      usageRate: number; // 0-100
    };
    influence: {
      teamSize: number;
      decisionPower: number; // 1-10
      adoptionInfluence: number; // 1-10
    };
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCustomerRequest {
  name: string;
  industry?: string;
  companySize?: string;
  segment?: string;
  contractValue?: number;
  startDate?: string; // ISO date string
  accountManager?: string;
  healthScore?: number;
  notes?: string;
  usageData?: {
    activeUsersCount?: number;
    seatsPurchased?: number;
    seatsUsed?: number;
  };
  featureUsage?: Array<{
    feature: string;
    activeUsersCount?: number;
    utilizationPercent?: number;
  }>;
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
  stakeholders?: StakeholderData[];
}

export interface UpdateCustomerRequest {
  name?: string;
  industry?: string;
  companySize?: string;
  segment?: string;
  contractValue?: number;
  startDate?: string; // ISO date string
  accountManager?: string;
  healthScore?: number;
  notes?: string;
  usageData?: {
    activeUsersCount?: number;
    seatsPurchased?: number;
    seatsUsed?: number;
  };
  featureUsage?: Array<{
    feature: string;
    activeUsersCount?: number;
    utilizationPercent?: number;
  }>;
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
  stakeholders?: StakeholderData[];
}
