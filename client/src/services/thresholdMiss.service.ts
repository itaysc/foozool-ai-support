import apiService from './api-service';
import { 
  IThresholdMissStats, 
  IThresholdMissSummary, 
  IThresholdMissDetails 
} from '../types/thresholdMiss';

export class ThresholdMissService {
  /**
   * Get threshold miss summary for the organization
   */
  static async getSummary(): Promise<IThresholdMissSummary> {
    try {
      const response = await apiService.thresholdMisses.getSummary();
      return response.data;
    } catch (error) {
      console.error('Error fetching threshold miss summary:', error);
      throw error;
    }
  }

  /**
   * Get threshold miss statistics for a specific time range
   */
  static async getStats(startDate: Date, endDate: Date): Promise<IThresholdMissStats[]> {
    try {
      const response = await apiService.thresholdMisses.getStats({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching threshold miss stats:', error);
      throw error;
    }
  }

  /**
   * Get detailed threshold misses for a specific time range
   */
  static async getDetails(
    startDate: Date, 
    endDate: Date, 
    limit: number = 100, 
    skip: number = 0
  ): Promise<IThresholdMissDetails> {
    try {
      const response = await apiService.thresholdMisses.getDetails({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit,
        skip
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching threshold miss details:', error);
      throw error;
    }
  }
}
