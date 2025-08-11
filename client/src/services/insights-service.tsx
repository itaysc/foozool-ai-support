import axios from '@/services/axios';
import config from '@/config';
import { InsightsResponse, InsightSummaryResponse } from '@/types/insight';

const getRoute = (endpoint: string) => {
  return `${config.apiUrl}/${endpoint}`;
};

export const insightsService = {
  /**
   * Get insights for a specific organization
   */
  async getInsightsByOrganization(organizationId: string): Promise<InsightsResponse> {
    const response = await axios.get(getRoute(`insights/${organizationId}`));
    return response.data;
  },

  /**
   * Get insights summary for a specific organization
   */
  async getInsightsSummary(organizationId: string): Promise<InsightSummaryResponse> {
    const response = await axios.get(getRoute(`insights/${organizationId}/summary`));
    return response.data;
  },

  /**
   * Get all insights (admin function)
   */
  async getAllInsights(limit = 100, skip = 0): Promise<InsightsResponse> {
    const response = await axios.get(getRoute(`insights?limit=${limit}&skip=${skip}`));
    return response.data;
  }
};

export default insightsService;