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
  async getMetrics(timeRange?: { start: string; end: string }): Promise<DashboardMetrics> {
    try {
      const params: any = { 
        useCache: false,
        noCache: true,
        _t: Date.now()
      };
      if (timeRange) {
        params.start = timeRange.start;
        params.end = timeRange.end;
      }
      
      const response = await axios.get(getRoute('metrics'), { 
        params,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
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
  async getInsights(timeRange?: { start: string; end: string }): Promise<DashboardInsights> {
    try {
      const params: any = { 
        useCache: false,
        noCache: true,
        _t: Date.now()
      };
      if (timeRange) {
        params.start = timeRange.start;
        params.end = timeRange.end;
      }
      
      const response = await axios.get(getRoute('insights'), { 
        params,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
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
  async getAlerts(timeRange?: { start: string; end: string }): Promise<DashboardAlert[]> {
    try {
      const params: any = { 
        useCache: false,
        noCache: true,
        _t: Date.now()
      };
      if (timeRange) {
        params.start = timeRange.start;
        params.end = timeRange.end;
      }
      
      const response = await axios.get(getRoute('alerts'), { 
        params,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
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
        params: { 
          useCache: false,
          noCache: true,
          _t: Date.now()
        },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      console.log('🔍 Dashboard service: Performance response received');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching performance comparison:', error);
      throw error;
    }
  },

  /**
   * Get time-series data for charts
   */
  async getTimeSeriesData(timeRange?: { start: string; end: string }): Promise<{
    volumeData: Array<{ date: string; tickets: number }>;
    satisfactionData: Array<{ date: string; satisfaction: number }>;
  }> {
    try {
      const params: any = { 
        useCache: false,
        noCache: true,
        _t: Date.now()
      };
      if (timeRange) {
        params.start = timeRange.start;
        params.end = timeRange.end;
      }
      
      console.log('🔄 Calling time-series endpoint with params:', params);
      const response = await axios.get(getRoute('timeseries'), { 
        params,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      console.log('📈 Time-series response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching time-series data:', error);
      throw error;
    }
  },

  /**
   * Get all dashboard data in one call
   */
  async getAllDashboardData(timeRange?: { start: string; end: string }): Promise<DashboardData> {
    try {
      const [metrics, insights, alerts, performance, timeSeriesData] = await Promise.all([
        this.getMetrics(timeRange),
        this.getInsights(timeRange),
        this.getAlerts(timeRange),
        this.getPerformance(),
        this.getTimeSeriesData(timeRange)
      ]);

      return {
        metrics,
        insights,
        alerts,
        performance,
        timeSeriesData
      };
    } catch (error) {
      console.error('Error fetching all dashboard data:', error);
      throw error;
    }
  }
};

export default dashboardService; 