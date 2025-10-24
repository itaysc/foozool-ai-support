export interface ILead {
  _id: string;
  name: string;
  email: string;
  company?: string;
  message?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  company?: string;
  message?: string;
}

export interface UpdateLeadRequest {
  name?: string;
  email?: string;
  company?: string;
  message?: string;
  status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
}

export interface LeadListResponse {
  leads: ILead[];
  total: number;
  page: number;
  pages: number;
}

export interface LeadStats {
  total: number;
  new: number;
  byStatus: Record<string, number>;
}

export interface LeadFilters {
  page?: number;
  limit?: number;
  status?: string;
}
