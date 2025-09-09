import axios from '@/services/axios';
import config from '@/config';

const base = `${config.apiUrl}/customer-activity`;

export type MetricType = 'count' | 'amount' | 'percentage' | 'duration' | 'custom';

export interface CustomerActivityDto {
  _id: string;
  organizationId: string;
  customerId: string;
  solutionName: string;
  metricType: MetricType;
  metricValue: number;
  unit?: string;
  periodStart?: string;
  periodEnd?: string;
  activityDate?: string;
  createdAt: string;
  updatedAt: string;
}

export async function listByCustomer(customerId?: string): Promise<CustomerActivityDto[]> {
  const { data } = await axios.get(base, { params: { customerId } });
  return data.payload || [];
}

export async function createActivity(payload: Omit<CustomerActivityDto, '_id' | 'createdAt' | 'updatedAt' | 'organizationId'>): Promise<CustomerActivityDto> {
  const { data } = await axios.post(base, payload);
  return data.payload;
}

export async function deleteActivity(activityId: string): Promise<void> {
  await axios.delete(`${base}/${activityId}`);
}

export default { listByCustomer, createActivity, deleteActivity };


