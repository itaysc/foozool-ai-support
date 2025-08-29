import axios from '@/services/axios';
import { 
  AnomalyDetectionSettings, 
  AnomalySettingsResponse, 
  UpdateAnomalySettingsRequest 
} from '../types/anomaly';
import { timeStringToMs, msToTimeString } from '@/utils/time-format';



const getRoute = (endpoint: string) => {
  return `/${endpoint}`;
};

export const anomalySettingsService = {
  /**
   * Get anomaly detection settings for an organization
   */
  async getAnomalySettings(organizationId: string): Promise<AnomalyDetectionSettings> {
    try {
      const response = await axios.get<{ status: number; payload: AnomalyDetectionSettings }>(
        `${getRoute(`organizations/${organizationId}/anomaly-settings`)}?t=${Date.now()}`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      
      if (response.data.status === 200) {
        return response.data.payload;
      } else {
        throw new Error('Failed to fetch anomaly settings');
      }
    } catch (error) {
      console.error('Error fetching anomaly settings:', error);
      throw error;
    }
  },

  /**
   * Update anomaly detection settings for an organization
   */
  async updateAnomalySettings(
    organizationId: string, 
    settings: UpdateAnomalySettingsRequest
  ): Promise<AnomalyDetectionSettings> {
    try {
      const response = await axios.put<{ status: number; payload: AnomalyDetectionSettings }>(
        `${getRoute(`organizations/${organizationId}/anomaly-settings`)}`,
        settings
      );
      
      if (response.data.status === 200) {
        return response.data.payload;
      } else {
        throw new Error('Failed to update anomaly settings');
      }
    } catch (error) {
      console.error('Error updating anomaly settings:', error);
      throw error;
    }
  },

  /**
   * Reset anomaly detection settings to defaults
   */
  async resetAnomalySettings(organizationId: string): Promise<AnomalyDetectionSettings> {
    try {
      const response = await axios.post<{ status: number; payload: AnomalyDetectionSettings }>(
        `${getRoute(`organizations/${organizationId}/anomaly-settings/reset`)}`
      );
      
      if (response.data.status === 200) {
        return response.data.payload;
      } else {
        throw new Error('Failed to reset anomaly settings');
      }
    } catch (error) {
      console.error('Error resetting anomaly settings:', error);
      throw error;
    }
  },

  /**
   * Convert milliseconds to human-readable time format
   */
  formatTimeWindow(milliseconds: number): string {
    return msToTimeString(milliseconds);
  },

  /**
   * Convert human-readable time format to milliseconds
   */
  parseTimeWindow(timeString: string): number {
    return timeStringToMs(timeString);
  }
};
