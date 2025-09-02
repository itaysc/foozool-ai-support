export interface ICustomer {
  _id?: string;
  organizationId: string; // Multi-tenancy: which organization owns this customer
  name: string;
  industry?: string;
  companySize?: string; // e.g., "1-10", "11-50", "51-200", "201-500", "500+"
  contractValue?: number;
  startDate?: Date;
  accountManager?: string; // Name of the account manager/CSM
  healthScore?: number; // 1-10 scale
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCustomerRequest {
  name: string;
  industry?: string;
  companySize?: string;
  contractValue?: number;
  startDate?: string; // ISO date string
  accountManager?: string;
  healthScore?: number;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  industry?: string;
  companySize?: string;
  contractValue?: number;
  startDate?: string; // ISO date string
  accountManager?: string;
  healthScore?: number;
  notes?: string;
}
