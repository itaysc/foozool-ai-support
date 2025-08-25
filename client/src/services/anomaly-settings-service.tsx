import axios from '@/services/axios';
import { 
  AnomalyDetectionSettings, 
  AnomalySettingsResponse, 
  UpdateAnomalySettingsRequest 
} from '../types/anomaly';



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
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  },

  /**
   * Convert human-readable time format to milliseconds
   */
  parseTimeWindow(timeString: string): number {
    if (!timeString || typeof timeString !== 'string') {
      return 0;
    }
    
    // Remove extra spaces and normalize
    const normalized = timeString.trim().toLowerCase();
    
    // Handle different formats: "1h 30m", "90m", "1.5h", "90", etc.
    let hours = 0;
    let minutes = 0;
    
    // Extract hours (supports decimal: 1.5h = 1 hour 30 minutes)
    const hoursMatch = normalized.match(/(\d+(?:\.\d+)?)h/);
    if (hoursMatch) {
      const hourValue = parseFloat(hoursMatch[1]);
      hours = Math.floor(hourValue);
      minutes = Math.round((hourValue - hours) * 60);
    }
    
    // Extract minutes
    const minutesMatch = normalized.match(/(\d+)m/);
    if (minutesMatch) {
      minutes += parseInt(minutesMatch[1]);
    }
    
    // Handle pure number input (assume minutes)
    if (!hoursMatch && !minutesMatch && /^\d+$/.test(normalized)) {
      minutes = parseInt(normalized);
    }
    
    // Convert to milliseconds
    const totalMs = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
    
    // Ensure minimum value (1 minute)
    return Math.max(totalMs, 60 * 1000);
  }
};
