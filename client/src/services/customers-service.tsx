import axios from '@/services/axios';
import config from '@/config';
import { 
  ICustomer, 
  CreateCustomerRequest, 
  UpdateCustomerRequest, 
  CustomerListResponse, 
  CustomerStats,
  CustomerFilters 
} from '@/types';

const getRoute = (endpoint: string) => {
  return `${config.apiUrl}/${endpoint}`;
};

const customersService = {
  // Get all customers with pagination and filtering
  async getAll(filters: CustomerFilters = {}): Promise<CustomerListResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.industry) params.append('industry', filters.industry);
    if (filters.companySize) params.append('companySize', filters.companySize);
    if (filters.segment) params.append('segment', filters.segment);
    if (filters.accountManager) params.append('accountManager', filters.accountManager);
    if (filters.healthScoreMin) params.append('healthScoreMin', filters.healthScoreMin.toString());
    if (filters.healthScoreMax) params.append('healthScoreMax', filters.healthScoreMax.toString());

    const response = await axios.get(getRoute('customers'), { params });
    return response.data.payload;
  },

  // Get customer statistics
  async getStats(): Promise<CustomerStats> {
    const response = await axios.get(getRoute('customers/stats'));
    return response.data.payload;
  },

  // Get customer by ID
  async getById(id: string): Promise<ICustomer> {
    const response = await axios.get(getRoute(`customers/${id}`));
    return response.data.payload;
  },

    // Get customer dashboard data
  async getDashboardData(id: string): Promise<any> {
    const response = await axios.get(getRoute(`customers/${id}/dashboard`));
    return response.data.payload;
  },

  // Create new customer
  async create(data: CreateCustomerRequest): Promise<ICustomer> {
    const response = await axios.post(getRoute('customers'), data);
    return response.data.payload;
  },

  // Update customer
  async update(id: string, data: UpdateCustomerRequest): Promise<ICustomer> {
    const response = await axios.put(getRoute(`customers/${id}`), data);
    return response.data.payload;
  },

  // Delete customer
  async delete(id: string): Promise<void> {
    await axios.delete(getRoute(`customers/${id}`));
  },
};

export default customersService;
