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
  // Handle special routes that don't follow the dashboard pattern
  if (method.startsWith('insights/')) {
    return `${config.apiUrl}/${method}`;
  }
  return `${config.apiUrl}/insights/dashboard/${method}`;
};

const dashboardService = {
  /**
   * Get comprehensive dashboard metrics
   */
  async getMetrics(timeRange?: { start: string; end: string }, useCache: boolean = true): Promise<DashboardMetrics> {
    try {
      const params: any = { 
        useCache: useCache ? 'true' : 'false',
        _t: Date.now()
      };
      if (timeRange) {
        params.start = timeRange.start;
        params.end = timeRange.end;
      }
      
      const response = await axios.get(getRoute('metrics'), { 
        params,
        headers: {
          'Cache-Control': useCache ? 'max-age=300' : 'no-cache, no-store, must-revalidate',
          'Pragma': useCache ? '' : 'no-cache',
          'Expires': useCache ? '' : '0'
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
  async getInsights(timeRange?: { start: string; end: string }, useCache: boolean = true): Promise<DashboardInsights> {
    try {
      const params: any = { 
        useCache: useCache ? 'true' : 'false',
        _t: Date.now()
      };
      if (timeRange) {
        params.start = timeRange.start;
        params.end = timeRange.end;
      }
      
      const response = await axios.get(getRoute('insights'), { 
        params,
        headers: {
          'Cache-Control': useCache ? 'max-age=300' : 'no-cache, no-store, must-revalidate',
          'Pragma': useCache ? '' : 'no-cache',
          'Expires': useCache ? '' : '0'
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
  async getAlerts(timeRange?: { start: string; end: string }, useCache: boolean = true): Promise<DashboardAlert[]> {
    try {
      const params: any = { 
        useCache: useCache ? 'true' : 'false',
        _t: Date.now()
      };
      if (timeRange) {
        params.start = timeRange.start;
        params.end = timeRange.end;
      }
      
      const response = await axios.get(getRoute('alerts'), { 
        params,
        headers: {
          'Cache-Control': useCache ? 'max-age=300' : 'no-cache, no-store, must-revalidate',
          'Pragma': useCache ? '' : 'no-cache',
          'Expires': useCache ? '' : '0'
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
   * Get performance comparison data
   */
  async getPerformance(useCache: boolean = true): Promise<PerformanceComparison> {
    try {
      const params: any = { 
        useCache: useCache ? 'true' : 'false',
        _t: Date.now()
      };
      
      const response = await axios.get(getRoute('performance'), { 
        params,
        headers: {
          'Cache-Control': useCache ? 'max-age=300' : 'no-cache, no-store, must-revalidate',
          'Pragma': useCache ? '' : 'no-cache',
          'Expires': useCache ? '' : '0'
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching performance data:', error);
      throw error;
    }
  },

  /**
   * Get time-series data for charts
   */
  async getTimeSeriesData(timeRange?: { start: string; end: string }, useCache: boolean = true): Promise<{
    volumeData: Array<{ date: string; tickets: number }>;
    satisfactionData: Array<{ date: string; satisfaction: number }>;
  }> {
    try {
      const params: any = { 
        useCache: useCache ? 'true' : 'false',
        _t: Date.now()
      };
      if (timeRange) {
        params.start = timeRange.start;
        params.end = timeRange.end;
      }
      
      const response = await axios.get(getRoute('timeseries'), { 
        params,
        headers: {
          'Cache-Control': useCache ? 'max-age=300' : 'no-cache, no-store, must-revalidate',
          'Pragma': useCache ? '' : 'no-cache',
          'Expires': useCache ? '' : '0'
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching time-series data:', error);
      throw error;
    }
  },

  /**
   * Get detailed user agent analytics
   */
  async getUserAgentAnalytics(timeRange?: { start: string; end: string }, useCache: boolean = true): Promise<any> {
    try {
      const params: any = { 
        useCache: useCache ? 'true' : 'false',
        _t: Date.now()
      };
      if (timeRange) {
        params.start = timeRange.start;
        params.end = timeRange.end;
      }
      
      const response = await axios.get(getRoute('user-agent-analytics'), { 
        params,
        headers: {
          'Cache-Control': useCache ? 'max-age=300' : 'no-cache, no-store, must-revalidate',
          'Pragma': useCache ? '' : 'no-cache',
          'Expires': useCache ? '' : '0'
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user agent analytics:', error);
      throw error;
    }
  },

  /**
   * Get all dashboard data using optimized endpoint (single API call)
   */
  async getOptimizedDashboardData(timeRange?: { start: string; end: string }, useCache: boolean = true): Promise<any> {
    try {
      const params: any = { 
        useCache: useCache ? 'true' : 'false',
        _t: Date.now()
      };
      if (timeRange) {
        params.start = timeRange.start;
        params.end = timeRange.end;
      }
      
      console.log('🚀 Calling optimized dashboard endpoint');
      const startTime = Date.now();
      
      const response = await axios.get(getRoute('optimized'), { 
        params,
        headers: {
          'Cache-Control': useCache ? 'max-age=300' : 'no-cache, no-store, must-revalidate',
          'Pragma': useCache ? '' : 'no-cache',
          'Expires': useCache ? '' : '0'
        }
      });
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ Optimized dashboard loaded in ${loadTime}ms`);
      console.log('📊 Optimized response metadata:', response.data.data.metadata);
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching optimized dashboard data:', error);
      throw error;
    }
  },

  /**
   * Get enriched tickets with Zendesk data
   */
  async getEnrichedTickets(
    organizationId: string,
    options: {
      timeRange?: { start: string; end: string };
      limit?: number;
      enrichWithZendesk?: boolean;
      useCache?: boolean;
    } = {}
  ): Promise<any[]> {
    const {
      timeRange,
      limit = 100, // Reduced from 1000 to 100 for better insights
      enrichWithZendesk = true,
      useCache = true // Always default to true
    } = options;

    try {
      const params = new URLSearchParams({
        organizationId,
        limit: limit.toString(),
        enrichWithZendesk: enrichWithZendesk.toString(),
        useCache: useCache.toString() // Always send useCache parameter
      });

      if (timeRange) {
        params.append('startDate', timeRange.start);
        params.append('endDate', timeRange.end);
      }

      const response = await axios.get(getRoute('enriched-tickets'), { 
        params,
        headers: {
          'Cache-Control': useCache ? 'max-age=300' : 'no-cache, no-store, must-revalidate',
          'Pragma': useCache ? '' : 'no-cache',
          'Expires': useCache ? '' : '0'
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching enriched tickets:', error);
      throw error;
    }
  },

  async getEnrichedAnalytics(
    options: {
      timeRange?: { start: string; end: string };
      useOrganizationSettings?: boolean;
      useCache?: boolean;
    } = {}
  ): Promise<any> {
    const {
      timeRange,
      useOrganizationSettings = true,
      useCache = true // Always default to true
    } = options;

    try {
      const params = new URLSearchParams({
        useOrganizationSettings: useOrganizationSettings.toString(),
        useCache: useCache.toString() // Always send useCache parameter
      });

      if (timeRange) {
        params.append('startDate', timeRange.start);
        params.append('endDate', timeRange.end);
      }

      const response = await axios.get(getRoute('insights/enriched-analytics'), { 
        params,
        headers: {
          'Cache-Control': useCache ? 'max-age=300' : 'no-cache, no-store, must-revalidate',
          'Pragma': useCache ? '' : 'no-cache',
          'Expires': useCache ? '' : '0'
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching enriched analytics:', error);
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