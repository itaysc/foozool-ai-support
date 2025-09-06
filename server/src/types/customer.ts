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
}
