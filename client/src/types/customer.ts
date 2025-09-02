export interface ICustomer {
  _id: string;
  organizationId: string;
  name: string;
  industry?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  contractValue?: number;
  startDate?: string;
  accountManager?: string;
  healthScore?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  industry?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  contractValue?: number;
  startDate?: string;
  accountManager?: string;
  healthScore?: number;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  industry?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  contractValue?: number;
  startDate?: string;
  accountManager?: string;
  healthScore?: number;
  notes?: string;
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
  accountManager?: string;
  healthScoreMin?: number;
  healthScoreMax?: number;
}
