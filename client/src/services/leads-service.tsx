import axios from '@/services/axios';
import config from '@/config';
import { 
  ILead, 
  CreateLeadRequest, 
  UpdateLeadRequest, 
  LeadListResponse, 
  LeadStats,
  LeadFilters 
} from '@/types/lead';

const getRoute = (endpoint: string) => {
  return `${config.apiUrl}/${endpoint}`;
};

const leadsService = {
  // Create a new lead
  async create(leadData: CreateLeadRequest): Promise<ILead> {
    const response = await axios.post(getRoute('v1/lead'), leadData);
    return response.data.data;
  },

  // Get all leads with pagination and filtering
  async getAll(filters: LeadFilters = {}): Promise<LeadListResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);

    const response = await axios.get(getRoute('v1/leads'), { params });
    return response.data.data;
  },

  // Get lead by ID
  async getById(id: string): Promise<ILead> {
    const response = await axios.get(getRoute(`v1/leads/${id}`));
    return response.data.data;
  },

  // Update lead status
  async updateStatus(id: string, status: string): Promise<ILead> {
    const response = await axios.patch(getRoute(`v1/leads/${id}/status`), { status });
    return response.data.data;
  },

  // Update lead
  async update(id: string, leadData: UpdateLeadRequest): Promise<ILead> {
    const response = await axios.put(getRoute(`v1/leads/${id}`), leadData);
    return response.data.data;
  },

  // Delete lead
  async delete(id: string): Promise<boolean> {
    const response = await axios.delete(getRoute(`v1/leads/${id}`));
    return response.data.success;
  },

  // Get lead statistics
  async getStats(): Promise<LeadStats> {
    const response = await axios.get(getRoute('v1/leads/stats'));
    return response.data.data;
  }
};

export default leadsService;
