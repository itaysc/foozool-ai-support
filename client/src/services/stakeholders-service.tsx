import axios from '@/services/axios';
import config from '@/config';

export interface StakeholderData {
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
}

export interface Stakeholder extends StakeholderData {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

const getRoute = (endpoint: string) => {
  return `${config.apiUrl}/${endpoint}`;
};

const stakeholdersService = {
  // Get all stakeholders for a customer
  async getByCustomerId(customerId: string): Promise<Stakeholder[]> {
    const response = await axios.get(getRoute(`customers/${customerId}/stakeholders`));
    return response.data.payload;
  },

  // Add a new stakeholder to a customer
  async create(customerId: string, data: StakeholderData): Promise<Stakeholder> {
    console.log('🔄 StakeholdersService: create called with customerId:', customerId, 'data:', data);
    const url = getRoute(`customers/${customerId}/stakeholders`);
    console.log('🔄 StakeholdersService: Making POST request to:', url);
    const response = await axios.post(url, data);
    console.log('🔄 StakeholdersService: POST request completed, response:', response.data);
    return response.data.payload;
  },

  // Update a stakeholder
  async update(customerId: string, stakeholderId: string, data: Partial<StakeholderData>): Promise<Stakeholder> {
    const response = await axios.put(getRoute(`customers/${customerId}/stakeholders/${stakeholderId}`), data);
    return response.data.payload;
  },

  // Delete a stakeholder
  async delete(customerId: string, stakeholderId: string): Promise<void> {
    await axios.delete(getRoute(`customers/${customerId}/stakeholders/${stakeholderId}`));
  },

};

export default stakeholdersService;
