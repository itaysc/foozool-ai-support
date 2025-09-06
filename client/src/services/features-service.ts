import axios from '@/services/axios';
import config from '@/config';

const base = `${config.apiUrl}/features`;

export interface FeatureDto { _id: string; name: string; organizationId: string }
export interface FeatureUsageDto {
  _id: string;
  organizationId: string;
  featureId: string;
  featureName: string;
  customerId?: string;
  activeUsersCount?: number;
  utilizationPercent?: number;
  usageDate?: string;
  createdAt: string;
}

export async function getFeatures(): Promise<FeatureDto[]> {
  const { data } = await axios.get(`${base}`);
  return data.features || [];
}

export async function upsertFeature(name: string): Promise<FeatureDto> {
  const { data } = await axios.post(`${base}`, { name });
  return data.feature;
}

export async function getFeatureUsage(params: { customerId?: string } = {}): Promise<FeatureUsageDto[]> {
  const { data } = await axios.get(`${base}/usage`, { params });
  return data.usage || [];
}

export async function createFeatureUsage(payload: {
  featureId?: string;
  featureName?: string;
  customerId?: string;
  activeUsersCount?: number;
  utilizationPercent?: number;
  usageDate?: string;
}): Promise<FeatureUsageDto> {
  const { data } = await axios.post(`${base}/usage`, payload);
  return data.usage;
}

export default { getFeatures, upsertFeature, getFeatureUsage, createFeatureUsage };


