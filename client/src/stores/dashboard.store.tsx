import { makeAutoObservable, runInAction } from 'mobx';
import dashboardService from '@/services/dashboard-service';
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
  isLoading = false;
  error: string | null = null;
  lastUpdated: Date | null = null;

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

  setLastUpdated = (date: Date) => {
    this.lastUpdated = date;
  };

  fetchMetrics = async (timeRange?: { start: string; end: string }) => {
    try {
      this.setLoading(true);
      this.setError(null);
      const metrics = await dashboardService.getMetrics(timeRange);
      runInAction(() => {
        this.setMetrics(metrics);
        this.setLastUpdated(new Date());
      });
    } catch (error: any) {
      runInAction(() => {
        this.setError(error.message || 'Failed to fetch metrics');
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  };

  fetchInsights = async (timeRange?: { start: string; end: string }) => {
    try {
      this.setLoading(true);
      this.setError(null);
      const insights = await dashboardService.getInsights(timeRange);
      runInAction(() => {
        this.setInsights(insights);
        this.setLastUpdated(new Date());
      });
    } catch (error: any) {
      runInAction(() => {
        this.setError(error.message || 'Failed to fetch insights');
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  };

  fetchAlerts = async (timeRange?: { start: string; end: string }) => {
    try {
      this.setLoading(true);
      this.setError(null);
      const alerts = await dashboardService.getAlerts(timeRange);
      runInAction(() => {
        this.setAlerts(alerts);
        this.setLastUpdated(new Date());
      });
    } catch (error: any) {
      runInAction(() => {
        this.setError(error.message || 'Failed to fetch alerts');
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  };

  fetchPerformance = async () => {
    try {
      this.setLoading(true);
      this.setError(null);
      const performance = await dashboardService.getPerformance();
      runInAction(() => {
        this.setPerformance(performance);
        this.setLastUpdated(new Date());
      });
    } catch (error: any) {
      runInAction(() => {
        this.setError(error.message || 'Failed to fetch performance data');
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
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