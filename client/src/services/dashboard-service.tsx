import axios from '@/services/axios';
import config from '@/config';
import { 
  DashboardMetrics, 
  DashboardInsights, 
  DashboardAlert, 
  PerformanceComparison,
  DashboardData 
} from '@/types/insights';

const getRoute = (method: string) => {
  return `${config.apiUrl}/insights/dashboard/${method}`;
};

const dashboardService = {
  /**
   * Get comprehensive dashboard metrics
   */
  async getMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await axios.get(getRoute('metrics'), {
        params: { useCache: false }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  },

  /**
   * Get AI-powered dashboard insights
   */
  async getInsights(): Promise<DashboardInsights> {
    try {
      const response = await axios.get(getRoute('insights'), {
        params: { useCache: false }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard insights:', error);
      throw error;
    }
  },

  /**
   * Get real-time alerts and notifications
   */
  async getAlerts(): Promise<DashboardAlert[]> {
    try {
      const response = await axios.get(getRoute('alerts'), {
        params: { useCache: false }
      });
      return response.data.data.map((alert: any) => ({
        ...alert,
        timestamp: new Date(alert.timestamp)
      }));
    } catch (error) {
      console.error('Error fetching dashboard alerts:', error);
      throw error;
    }
  },

  /**
   * Get performance comparison with previous periods
   */
  async getPerformance(): Promise<PerformanceComparison> {
    try {
      console.log('🔍 Dashboard service: Making performance request to:', getRoute('performance'));
      const response = await axios.get(getRoute('performance'), {
        params: { useCache: false }
      });
      console.log('🔍 Dashboard service: Performance response received');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching performance comparison:', error);
      throw error;
    }
  },

  /**
   * Get all dashboard data in one call
   */
  async getAllDashboardData(): Promise<DashboardData> {
    try {
      const [metrics, insights, alerts, performance] = await Promise.all([
        this.getMetrics(),
        this.getInsights(),
        this.getAlerts(),
        this.getPerformance()
      ]);

      return {
        metrics,
        insights,
        alerts,
        performance
      };
    } catch (error) {
      console.error('Error fetching all dashboard data:', error);
      throw error;
    }
  }
};

export default dashboardService; 