import axios from '@/services/axios';
import config from '@/config';
import { 
  AnomaliesResponse, 
  SingleAnomalyResponse, 
  AnomalyActionResponse,
  AnomalyActionRequest,
  AnomalyFilter,
  AnomalyPagination,
  AnomalyStats
} from '@/types/anomaly';

const getRoute = (endpoint: string) => {
  return `${config.apiUrl}/${endpoint}`;
};

export const anomaliesService = {
  /**
   * Get all anomalies with filtering and pagination
   */
  async getAnomalies(filter: AnomalyFilter = {}, pagination: AnomalyPagination = { limit: 50, offset: 0 }): Promise<AnomaliesResponse> {
    const params = new URLSearchParams();
    
    // Add filter parameters
    if (filter.status && filter.status !== 'all') {
      params.append('status', filter.status);
    }
    if (filter.type) {
      params.append('type', filter.type);
    }
    if (filter.severity) {
      params.append('severity', filter.severity);
    }
    if (filter.hours && filter.hours !== 'all') {
      params.append('hours', filter.hours.toString());
    }
    
    // Add pagination parameters
    params.append('limit', pagination.limit.toString());
    params.append('offset', pagination.offset.toString());
    
    const response = await axios.get(`${getRoute('anomalies')}?${params.toString()}`);
    
    // Handle different response structures
    if (response.data && response.data.payload) {
      return response.data.payload;
    }
    return response.data;
  },

  /**
   * Get anomaly statistics
   */
  async getAnomalyStats(hours: number = 24): Promise<AnomalyStats> {
    const response = await axios.get(`${getRoute('anomalies/stats')}?hours=${hours}`);
    return response.data.payload || response.data;
  },

  /**
   * Get a specific anomaly by ID
   */
  async getAnomalyById(id: string): Promise<SingleAnomalyResponse> {
    const response = await axios.get(getRoute(`anomalies/${id}`));
    return response.data;
  },

  /**
   * Acknowledge an anomaly
   */
  async acknowledgeAnomaly(id: string, action: AnomalyActionRequest): Promise<AnomalyActionResponse> {
    const response = await axios.post(getRoute(`anomalies/${id}/acknowledge`), action);
    return response.data;
  },

  /**
   * Resolve an anomaly
   */
  async resolveAnomaly(id: string, action: AnomalyActionRequest): Promise<AnomalyActionResponse> {
    const response = await axios.post(getRoute(`anomalies/${id}/resolve`), action);
    return response.data;
  },

  /**
   * Mark an anomaly as false positive
   */
  async markAsFalsePositive(id: string, action: AnomalyActionRequest): Promise<AnomalyActionResponse> {
    const response = await axios.post(getRoute(`anomalies/${id}/false-positive`), action);
    return response.data;
  },

  /**
   * Manually trigger anomaly detection
   */
  async triggerAnomalyDetection(): Promise<{ status: number; payload: { message: string; note: string } }> {
    const response = await axios.post(getRoute('anomalies/detect'));
    return response.data;
  }
};

export default anomaliesService;
