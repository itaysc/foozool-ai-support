import { makeAutoObservable, runInAction } from 'mobx';
import dashboardService from '@/services/dashboard-service';
import authStore from '@/stores/auth.store';
import { 
  DashboardMetrics, 
  DashboardInsights, 
  DashboardAlert, 
  PerformanceComparison,
  DashboardData 
} from '@/types/insights';

class DashboardStore {
  metrics: DashboardMetrics | null = null;
  insights: DashboardInsights | null = null;
  alerts: DashboardAlert[] = [];
  performance: PerformanceComparison | null = null;
  timeSeriesData: {
    volumeData: Array<{ date: string; tickets: number }>;
    satisfactionData: Array<{ date: string; satisfaction: number }>;
  } | null = null;
  enrichedTickets: any[] = [];
  isLoading = false;
  error: string | null = null;
  lastUpdated: Date | null = null;
  
  // Smart caching: track if this is the first load for each data type
  private firstLoadFlags = {
    metrics: true,
    insights: true,
    alerts: true,
    performance: true,
    timeSeriesData: true,
    allData: true,
    enrichedTickets: true
  };

  constructor() {
    makeAutoObservable(this);
  }

  setLoading = (loading: boolean) => {
    this.isLoading = loading;
  };

  setError = (error: string | null) => {
    this.error = error;
  };

  setMetrics = (metrics: DashboardMetrics) => {
    this.metrics = metrics;
  };

  setInsights = (insights: DashboardInsights) => {
    this.insights = insights;
  };

  setAlerts = (alerts: DashboardAlert[]) => {
    this.alerts = alerts;
  };

  setPerformance = (performance: PerformanceComparison) => {
    this.performance = performance;
  };

  setTimeSeriesData = (timeSeriesData: {
    volumeData: Array<{ date: string; tickets: number }>;
    satisfactionData: Array<{ date: string; satisfaction: number }>;
  }) => {
    this.timeSeriesData = timeSeriesData;
  };

  setEnrichedTickets = (tickets: any[]) => {
    this.enrichedTickets = tickets;
  };

  setLastUpdated = (date: Date) => {
    this.lastUpdated = date;
  };

  /**
   * Get cache preference for a specific data type
   * Returns false only on first load, true for subsequent loads
   */
  private getCachePreference(dataType: keyof typeof this.firstLoadFlags): boolean {
    return !this.firstLoadFlags[dataType];
  }

  /**
   * Mark a data type as loaded (no longer first load)
   */
  private markAsLoaded(dataType: keyof typeof this.firstLoadFlags): void {
    this.firstLoadFlags[dataType] = false;
  }

  /**
   * Reset first load flags (useful for time range changes)
   */
  resetFirstLoadFlags = (): void => {
    this.firstLoadFlags = {
      metrics: true,
      insights: true,
      alerts: true,
      performance: true,
      timeSeriesData: true,
      allData: true,
      enrichedTickets: true
    };
  };

  fetchMetrics = async (timeRange?: { start: string; end: string }) => {
    try {
      this.setLoading(true);
      this.setError(null);
      
      const useCache = this.getCachePreference('metrics');
      console.log(`📊 Fetching metrics (useCache: ${useCache})`);
      
      const metrics = await dashboardService.getMetrics(timeRange, useCache);
      
      runInAction(() => {
        this.setMetrics(metrics);
        this.markAsLoaded('metrics');
        this.setLastUpdated(new Date());
      });
      
      return metrics;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to fetch metrics');
      throw error;
    } finally {
      this.setLoading(false);
    }
  };

  fetchInsights = async (timeRange?: { start: string; end: string }) => {
    try {
      this.setLoading(true);
      this.setError(null);
      
      const useCache = this.getCachePreference('insights');
      console.log(`🧠 Fetching insights (useCache: ${useCache})`);
      
      const insights = await dashboardService.getInsights(timeRange, useCache);
      
      runInAction(() => {
        this.setInsights(insights);
        this.markAsLoaded('insights');
        this.setLastUpdated(new Date());
      });
      
      return insights;
    } catch (error) {
      console.error('Error fetching insights:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to fetch insights');
      throw error;
    } finally {
      this.setLoading(false);
    }
  };

  fetchAlerts = async (timeRange?: { start: string; end: string }) => {
    try {
      this.setLoading(true);
      this.setError(null);
      
      const useCache = this.getCachePreference('alerts');
      console.log(`🚨 Fetching alerts (useCache: ${useCache})`);
      
      const alerts = await dashboardService.getAlerts(timeRange, useCache);
      
      runInAction(() => {
        this.setAlerts(alerts);
        this.markAsLoaded('alerts');
        this.setLastUpdated(new Date());
      });
      
      return alerts;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to fetch alerts');
      throw error;
    } finally {
      this.setLoading(false);
    }
  };

  fetchPerformance = async () => {
    try {
      this.setLoading(true);
      this.setError(null);
      
      const useCache = this.getCachePreference('performance');
      console.log(`📈 Fetching performance (useCache: ${useCache})`);
      
      const performance = await dashboardService.getPerformance(useCache);
      
      runInAction(() => {
        this.setPerformance(performance);
        this.markAsLoaded('performance');
        this.setLastUpdated(new Date());
      });
      
      return performance;
    } catch (error) {
      console.error('Error fetching performance:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to fetch performance');
      throw error;
    } finally {
      this.setLoading(false);
    }
  };

  fetchTimeSeriesData = async (timeRange?: { start: string; end: string }) => {
    try {
      this.setLoading(true);
      this.setError(null);
      
      const useCache = this.getCachePreference('timeSeriesData');
      console.log(`📅 Fetching time series data (useCache: ${useCache})`);
      
      const timeSeriesData = await dashboardService.getTimeSeriesData(timeRange, useCache);
      
      runInAction(() => {
        this.setTimeSeriesData(timeSeriesData);
        this.markAsLoaded('timeSeriesData');
        this.setLastUpdated(new Date());
      });
      
      return timeSeriesData;
    } catch (error) {
      console.error('Error fetching time series data:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to fetch time series data');
      throw error;
    } finally {
      this.setLoading(false);
    }
  };

  async fetchEnrichedTickets(
    options: {
      timeRange?: { start: string; end: string };
      limit?: number;
      enrichWithZendesk?: boolean;
      useCache?: boolean;
    } = {}
  ) {
    try {
      this.setLoading(true);
      this.setError(null);
      
      const useCache = options.useCache ?? true; // Always default to true
      const limit = options.limit ?? 100; // Default to 100 for better insights
      console.log(`🔍 Fetching enriched tickets (useCache: ${useCache}, limit: ${limit})`);
      
      const organizationId = authStore.user?.organization;
      if (!organizationId) {
        throw new Error('No organization ID available');
      }
      
      const data = await dashboardService.getEnrichedTickets(
        organizationId.toString(),
        {
          ...options,
          limit, // Use the limit parameter
          useCache
        }
      );
      
      runInAction(() => {
        this.setEnrichedTickets(data);
        this.markAsLoaded('enrichedTickets');
        this.setLastUpdated(new Date());
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching enriched tickets:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to fetch enriched tickets');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async fetchEnrichedAnalytics(
    options: {
      timeRange?: { start: string; end: string };
      useOrganizationSettings?: boolean;
      useCache?: boolean;
    } = {}
  ) {
    try {
      this.setLoading(true);
      this.setError(null);
      
      const useCache = options.useCache ?? true; // Always default to true
      console.log(`🔍 Fetching enriched analytics (useCache: ${useCache})`);
      
      const data = await dashboardService.getEnrichedAnalytics({
        ...options,
        useCache
      });
      
      runInAction(() => {
        // Store the analytics data in the appropriate property
        // For now, we'll store it in insights since it's related
        if (data.insights) {
          this.setInsights(data.insights);
        }
        this.setLastUpdated(new Date());
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching enriched analytics:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to fetch enriched analytics');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  refreshEnrichedTickets = async (timeRange?: { start: string; end: string }) => {
    try {
      this.setLoading(true);
      this.setError(null);
      
      console.log(`🔄 Refreshing enriched tickets (no cache)`);
      
      const organizationId = authStore.user?.organization;
      if (!organizationId) {
        throw new Error('No organization ID available');
      }
      
      const data = await dashboardService.getEnrichedTickets(
        organizationId.toString(),
        {
          timeRange,
          useCache: false
        }
      );
      
      runInAction(() => {
        this.setEnrichedTickets(data);
        this.setLastUpdated(new Date());
      });
      
      return data;
    } catch (error) {
      console.error('Error refreshing enriched tickets:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to refresh enriched tickets');
      throw error;
    } finally {
      this.setLoading(false);
    }
  };

  fetchOptimizedDashboardData = async (timeRange?: { start: string; end: string }, useCache?: boolean) => {
    try {
      this.setLoading(true);
      this.setError(null);
      
      // Use provided useCache parameter or fall back to cache preference
      const shouldUseCache = useCache !== undefined ? useCache : this.getCachePreference('allData');
      console.log(`🚀 Fetching optimized dashboard data (useCache: ${shouldUseCache})`);
      
      const data = await dashboardService.getOptimizedDashboardData(timeRange, shouldUseCache);
      
      runInAction(() => {
        // Extract individual data sets from optimized response
        if (data.metrics) this.setMetrics(data.metrics);
        if (data.insights) this.setInsights(data.insights);
        if (data.alerts) this.setAlerts(data.alerts);
        if (data.performance) this.setPerformance(data.performance);
        if (data.timeSeriesData) this.setTimeSeriesData(data.timeSeriesData);
        
        this.markAsLoaded('allData');
        this.setLastUpdated(new Date());
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching optimized dashboard data:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to fetch optimized dashboard data');
      throw error;
    } finally {
      this.setLoading(false);
    }
  };

  fetchAllDashboardData = async (timeRange?: { start: string; end: string }) => {
    try {
      console.log('🔄 Fetching dashboard data with time range:', timeRange);
      this.setLoading(true);
      this.setError(null);
      const data: DashboardData = await dashboardService.getAllDashboardData(timeRange);
      console.log('📊 Received dashboard data:', data);
      runInAction(() => {
        console.log('📊 Setting metrics:', data.metrics);
        console.log('📊 Total tickets:', data.metrics?.totalTickets);
        console.log('📊 Recent tickets:', data.metrics?.recentTickets);
        this.setMetrics(data.metrics);
        this.setInsights(data.insights);
        this.setAlerts(data.alerts);
        this.setPerformance(data.performance);
        if (data.timeSeriesData) {
          console.log('📈 Setting time series data:', data.timeSeriesData);
          console.log('📊 Volume data points:', data.timeSeriesData.volumeData.length);
          console.log('📊 Satisfaction data points:', data.timeSeriesData.satisfactionData.length);
          console.log('📊 First volume point:', data.timeSeriesData.volumeData[0]);
          console.log('📊 Last volume point:', data.timeSeriesData.volumeData[data.timeSeriesData.volumeData.length - 1]);
          this.setTimeSeriesData(data.timeSeriesData);
        } else {
          console.log('⚠️ No time series data received');
        }
        this.setLastUpdated(new Date());
      });
    } catch (error: any) {
      console.error('❌ Error fetching dashboard data:', error);
      runInAction(() => {
        this.setError(error.message || 'Failed to fetch dashboard data');
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  };

  clearData = () => {
    this.metrics = null;
    this.insights = null;
    this.alerts = [];
    this.performance = null;
    this.timeSeriesData = null;
    this.error = null;
    this.lastUpdated = null;
    
    // Reset first load flags when clearing data
    this.resetFirstLoadFlags();
  };

  // Computed getters for easy access to data
  get hasData() {
    return this.metrics !== null || this.insights !== null || this.alerts.length > 0 || this.performance !== null;
  }

  get criticalAlerts() {
    return this.alerts.filter(alert => alert.severity === 'critical');
  }

  get highPriorityAlerts() {
    return this.alerts.filter(alert => alert.severity === 'high');
  }

  get totalAlerts() {
    return this.alerts.length;
  }

  get sentimentPercentage() {
    if (!this.metrics) return { positive: 0, negative: 0, neutral: 0 };
    
    const total = this.metrics.sentimentBreakdown.positive + 
                  this.metrics.sentimentBreakdown.negative + 
                  this.metrics.sentimentBreakdown.neutral;
    
    if (total === 0) return { positive: 0, negative: 0, neutral: 0 };
    
    return {
      positive: (this.metrics.sentimentBreakdown.positive / total) * 100,
      negative: (this.metrics.sentimentBreakdown.negative / total) * 100,
      neutral: (this.metrics.sentimentBreakdown.neutral / total) * 100
    };
  }
}

const dashboardStore = new DashboardStore();
export default dashboardStore; 