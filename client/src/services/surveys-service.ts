import { NPSInsights, NPSUpload, NPSUploadHistory } from '@/types/nps';
import axios from '@/services/axios';

const getRoute = (endpoint: string) => {
  return `${endpoint}`;
};

export type SurveyType = 'nps' | 'csat';

export const surveysService = {
  /**
   * Get NPS insights for the organization
   */
  async getNPSInsights(): Promise<NPSInsights | null> {
    const response = await axios.get(getRoute('surveys/nps/insights'));
    return response.data.data;
  },

  /**
   * Get CSAT insights for the organization
   */
  async getCSATInsights(): Promise<any | null> {
    const response = await axios.get(getRoute('surveys/csat/insights'));
    return response.data.data;
  },

  /**
   * Get NPS insights history
   */
  async getNPSInsightsHistory(options: { limit: number; offset: number }): Promise<NPSInsights[]> {
    const response = await axios.get(getRoute('surveys/nps/insights/history'), {
      params: options
    });
    return response.data.data;
  },

  /**
   * Get CSAT insights history
   */
  async getCSATInsightsHistory(options: { limit: number; offset: number }): Promise<any[]> {
    const response = await axios.get(getRoute('surveys/csat/insights/history'), {
      params: options
    });
    return response.data.data;
  },

  /**
   * Get upload status
   */
  async getUploadStatus(uploadId: string): Promise<NPSUpload> {
    const response = await axios.get(getRoute(`surveys/uploads/${uploadId}/status`));
    return response.data.data;
  },

  /**
   * Get upload history
   */
  async getUploadHistory(options: { limit: number; offset: number; status?: string; surveyType?: SurveyType }): Promise<NPSUploadHistory> {
    const response = await axios.get(getRoute('surveys/uploads/history'), {
      params: options
    });
    return response.data.data;
  },

  /**
   * Cancel upload
   */
  async cancelUpload(uploadId: string): Promise<void> {
    await axios.post(getRoute(`surveys/uploads/${uploadId}/cancel`));
  },

  /**
   * Delete upload
   */
  async deleteUpload(uploadId: string): Promise<void> {
    await axios.delete(getRoute(`surveys/uploads/${uploadId}`));
  },

  /**
   * Get upload statistics
   */
  async getUploadStatistics(surveyType?: SurveyType): Promise<any> {
    const params = surveyType ? { surveyType } : {};
    const response = await axios.get(getRoute('surveys/uploads/statistics'), {
      params
    });
    return response.data.data;
  },

  /**
   * Upload CSV file for NPS
   */
  async uploadNPSCSV(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(getRoute('surveys/nps/csv'), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Upload CSV file for CSAT
   */
  async uploadCSATCSV(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(getRoute('surveys/csat/csv'), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Upload JSON data for NPS
   */
  async uploadNPSJSON(data: any): Promise<any> {
    const response = await axios.post(getRoute('surveys/nps/json'), data);
    return response.data;
  },

  /**
   * Upload JSON data for CSAT
   */
  async uploadCSATJSON(data: any): Promise<any> {
    const response = await axios.post(getRoute('surveys/csat/json'), data);
    return response.data;
  },

  /**
   * Upload generic data with AI mapping for NPS
   */
  async uploadNPSGeneric(data: any): Promise<any> {
    const response = await axios.post(getRoute('surveys/nps/generic'), data);
    return response.data;
  },

  /**
   * Upload generic data with AI mapping for CSAT
   */
  async uploadCSATGeneric(data: any): Promise<any> {
    const response = await axios.post(getRoute('surveys/csat/generic'), data);
    return response.data;
  },

  /**
   * Process webhook data for NPS
   */
  async processNPSWebhook(data: any): Promise<any> {
    const response = await axios.post(getRoute('surveys/nps/webhook'), data);
    return response.data;
  },

  /**
   * Process webhook data for CSAT
   */
  async processCSATWebhook(data: any): Promise<any> {
    const response = await axios.post(getRoute('surveys/csat/webhook'), data);
    return response.data;
  }
};
