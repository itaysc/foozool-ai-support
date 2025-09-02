import { NPSInsights, NPSUpload, NPSUploadHistory } from '@/types/nps';
import axios from '@/services/axios';

const getRoute = (endpoint: string) => {
  return `${endpoint}`;
};

export const npsService = {
  /**
   * Get NPS insights for the organization
   */
  async getNPSInsights(): Promise<NPSInsights | null> {
    const response = await axios.get(getRoute('nps/insights'));
    return response.data.payload.insights;
  },

  /**
   * Get NPS insights history
   */
  async getNPSInsightsHistory(options: { limit: number; offset: number }): Promise<NPSInsights[]> {
    const response = await axios.get(getRoute('nps/insights/history'), {
      params: options
    });
    return response.data.payload.history;
  },

  /**
   * Get upload status
   */
  async getUploadStatus(uploadId: string): Promise<NPSUpload> {
    const response = await axios.get(getRoute(`nps/upload/status/${uploadId}`));
    return response.data.payload.status;
  },

  /**
   * Get upload history
   */
  async getUploadHistory(options: { limit: number; offset: number; status?: string }): Promise<NPSUploadHistory> {
    const response = await axios.get(getRoute('nps/upload/history'), {
      params: options
    });
    return response.data.payload.history;
  }
};
