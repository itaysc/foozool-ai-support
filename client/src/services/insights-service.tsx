import axios from '@/services/axios';
import config from '@/config';
import { InsightsResponse, InsightSummaryResponse } from '@/types/insight';
import { PredictionsResponse, PredictionSummaryResponse, AccuracyAnalysisResponse } from '@/types/prediction';
import { DateFilterState } from '@/components/insights/DateFilter';

const getRoute = (endpoint: string) => {
  return `${config.apiUrl}/${endpoint}`;
};

export const insightsService = {
  /**
   * Get insights for the current organization
   */
  async getInsightsByOrganization(dateFilter?: DateFilterState): Promise<InsightsResponse> {
    let url = getRoute('insights');
    
    // Add date filter parameters if provided
    if (dateFilter && (dateFilter.fromDate || dateFilter.toDate)) {
      const params = new URLSearchParams();
      if (dateFilter.fromDate) {
        params.append('fromDate', dateFilter.fromDate.toISOString());
      }
      if (dateFilter.toDate) {
        params.append('toDate', dateFilter.toDate.toISOString());
      }
      url += `?${params.toString()}`;
    }
    
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * Get insights summary for the current organization
   */
  async getInsightsSummary(): Promise<InsightSummaryResponse> {
    const response = await axios.get(getRoute('insights/summary'));
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
    return { success: true, data: response.data.payload?.allInsights || [] };
  }
  ,
  /**
   * Get Customer Success insights for all customers in the org (authenticated)
   */
  async getAllCustomerSuccessInsights(): Promise<{ success: boolean; data: Array<{ customerId: string; customerName?: string; insights: any[] }> }>{
    const response = await axios.get(getRoute(`insights/customer-success`));
    return { success: true, data: response.data.payload };
  },

  /**
   * Get all unified insights (NPS, CSAT, and Customer Success) for the organization
   */
  async getAllUnifiedInsights(customerId?: string): Promise<{ success: boolean; data: any[] }> {
    const url = customerId 
      ? getRoute(`insights/unified?customerId=${customerId}`)
      : getRoute('insights/unified');
    const response = await axios.get(url);
    return { success: true, data: response.data.data };
  },
  /**
   * Get top active users in the organization (last 30 days, limit 10)
   */
  async getTopActiveUsers(limit = 10, days = 30): Promise<{ success: boolean; data: Array<{ userId: string; name: string; email?: string; score: number; events: number }> }>{
    const response = await axios.get(getRoute(`analytics/top-users?limit=${limit}&days=${days}`));
    return { success: true, data: response.data.data };
  },

  /**
   * Generate customer meeting prep document for a specific customer
   */
  async generateCustomerMeetingPrep(customerId: string): Promise<Blob> {
    const response = await axios.post(getRoute(`insights/customer-meeting-prep/${customerId}`), {}, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Data Intelligence Methods
  /**
   * Get comprehensive data intelligence metrics for the organization
   */
  async getDataIntelligenceMetrics(): Promise<any> {
    const response = await axios.get(getRoute('insights/data-intelligence'));
    return response.data;
  },

  /**
   * Get customer-specific data intelligence
   */
  async getCustomerDataIntelligence(customerId: string): Promise<any> {
    const response = await axios.get(getRoute(`insights/data-intelligence/customer/${customerId}`));
    return response.data;
  },

  /**
   * Get health score for a specific customer
   */
  async getCustomerHealthScore(customerId: string): Promise<any> {
    const response = await axios.get(getRoute(`insights/health-score/${customerId}`));
    return response.data;
  },

  /**
   * Get health scores for all customers
   */
  async getAllCustomerHealthScores(): Promise<any> {
    const response = await axios.get(getRoute('insights/health-scores'));
    return response.data;
  },


  /**
   * Update assignee for a specific insight
   */
  async updateInsightAssignee(insightId: string, assignee: string | null): Promise<any> {
    const response = await axios.patch(getRoute(`insights/${insightId}/assignee`), {
      assignee
    });
    return response.data;
  },

  /**
   * Get all users in the organization
   */
  async getUsers(): Promise<{ success: boolean; data: Array<{ _id: string; firstName: string; lastName: string; email: string; fullName: string }> }> {
    const response = await axios.get(getRoute('users'));
    return { success: true, data: response.data };
  },

  /**
   * Update status for a specific insight
   */
  async updateInsightStatus(insightId: string, status: string): Promise<any> {
    const response = await axios.patch(getRoute(`insights/${insightId}/status`), {
      status
    });
    return response.data;
  }
};

export default insightsService;