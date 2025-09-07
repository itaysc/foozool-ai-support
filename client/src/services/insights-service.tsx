import axios from '@/services/axios';
import config from '@/config';
import { InsightsResponse, InsightSummaryResponse } from '@/types/insight';
import { PredictionsResponse, PredictionSummaryResponse, AccuracyAnalysisResponse } from '@/types/prediction';

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
  },

  // Prediction-related methods
  /**
   * Get predictions for the authenticated user's organization
   */
  async getPredictions(limit = 20): Promise<PredictionsResponse> {
    const response = await axios.get(getRoute(`predictions?limit=${limit}`));
    return { success: true, data: response.data, count: response.data.length };
  },

  /**
   * Get prediction summary for the authenticated user's organization
   */
  async getPredictionSummary(): Promise<PredictionSummaryResponse> {
    const response = await axios.get(getRoute(`predictions/summary`));
    return { success: true, data: response.data };
  },

  /**
   * Get high-risk predictions for immediate attention
   */
  async getHighRiskPredictions(): Promise<PredictionsResponse> {
    const response = await axios.get(getRoute(`predictions/high-risk`));
    return { success: true, data: response.data, count: response.data.length };
  },

  /**
   * Get prediction accuracy analysis for the authenticated user's organization
   */
  async getPredictionAccuracy(days = 30): Promise<AccuracyAnalysisResponse> {
    const response = await axios.get(getRoute(`predictions/accuracy?days=${days}`));
    return { success: true, data: response.data };
  },

  /**
   * Get Customer Success risk insights for a specific customer (authenticated)
   */
  async getCustomerSuccessInsights(customerId: string): Promise<{ success: boolean; data: any[] }>{
    const response = await axios.get(getRoute(`insights/customer-success/${customerId}`));
    return { success: true, data: response.data.payload };
  }
  ,
  /**
   * Get Customer Success insights for all customers in the org (authenticated)
   */
  async getAllCustomerSuccessInsights(): Promise<{ success: boolean; data: Array<{ customerId: string; customerName?: string; insights: any[] }> }>{
    const response = await axios.get(getRoute(`insights/customer-success`));
    return { success: true, data: response.data.payload };
  }
};

export default insightsService;