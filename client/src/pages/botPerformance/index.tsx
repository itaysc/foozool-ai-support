import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import {
  Box,
  Typography,
  Alert,
  AlertTitle,
  LinearProgress,
  CircularProgress,
  IconButton,
  Tooltip,
  Fab,
  Snackbar,
  Tabs,
  Tab
} from '@mui/material';
import {
  Refresh,
  SmartToy,
  Calculate,
  TrendingUp,
  RefreshOutlined
} from '@mui/icons-material';
import { useAuth } from '@/context/auth.context';
import TimeRangeSelector from '@/components/TimeRangeSelector';
import BotKPICards from '@/components/botPerformance/BotKPICards';
import BotPerformanceCharts from '@/components/botPerformance/BotPerformanceCharts';
import BotInsights from '@/components/botPerformance/BotInsights';
import EnhancedInsights from '@/components/botPerformance/EnhancedInsights';
import { 
  DashboardSkeleton, 
  KPICardsSkeleton, 
  ChartsSkeleton, 
  InsightsSkeleton, 
  SummaryTabSkeleton 
} from '@/components/botPerformance/BotPerformanceSkeletons';
import botPerformanceService, { DashboardData, Analytics, BenchmarkComparison } from '@/services/bot-performance-service';
import dashboardStore from '@/stores/dashboard.store';
import { useSearchParams } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bot-performance-tabpanel-${index}`}
      aria-labelledby={`bot-performance-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const BotPerformancePage = observer(() => {
  const { user, isLoading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<{
    start: Date;
    end: Date;
    label: string;
  }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
    label: '30d'
  });
  // Initialize active tab from URL params or default to 0
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam ? parseInt(tabParam, 10) : 0;
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [lastUsedCache, setLastUsedCache] = useState(true);



  // Calculate days from time range
  const getDaysFromTimeRange = () => {
    return Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const fetchAllData = async (useCache: boolean = true, retryCount: number = 0) => {
    if (!user?.organization) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const days = getDaysFromTimeRange();
      
      // Fetch all data in parallel
      const [dashboardResponse, analyticsResponse, benchmarksResponse] = await Promise.all([
        botPerformanceService.getDashboardData(days, useCache),
        botPerformanceService.getAnalytics(days, useCache),
        botPerformanceService.getBenchmarks(useCache),
        // Also fetch general insights from dashboard store
        dashboardStore.fetchInsights(timeRange)
      ]);

      setDashboardData(dashboardResponse);
      setAnalytics(analyticsResponse);
      setBenchmarks(benchmarksResponse);
      
      if (!useCache) {
        setSnackbarMessage('Bot performance data refreshed successfully');
        setSnackbarOpen(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bot performance data';
      
      // Retry once for authentication-related errors
      if (retryCount === 0 && (errorMessage.includes('401') || errorMessage.includes('authentication'))) {
        setTimeout(() => fetchAllData(useCache, retryCount + 1), 1000);
        return;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setLastUsedCache(true);
    fetchAllData(true);
  };

  const handleRefreshNoCache = () => {
    setLastUsedCache(false);
    fetchAllData(false);
  };

  const handleTimeRangeChange = (newTimeRange: { start: Date; end: Date; label: string }) => {
    setTimeRange(newTimeRange);
  };

  const handleCalculateMetrics = async () => {
    try {
      setIsLoading(true);
      await botPerformanceService.calculateMetrics();
      setSnackbarMessage('Metrics calculation triggered successfully');
      setSnackbarOpen(true);
      // Refresh data after calculation
      setTimeout(() => fetchAllData(false), 2000);
    } catch (err) {
      console.error('Error calculating metrics:', err);
      setError('Failed to trigger metrics calculation');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when time range changes
  useEffect(() => {
    // Only fetch data when auth is not loading and user has organization
    if (!authLoading && user?.organization) {
      fetchAllData();
    }
  }, [authLoading, user?.organization, timeRange]);

  // Transform data for charts
  const chartData = dashboardData ? botPerformanceService.transformChartData(dashboardData) : [];
  const kpiData = dashboardData ? botPerformanceService.transformKPIData(dashboardData.kpis) : null;

  // Extract action breakdown from analytics or create empty one
  const actionBreakdown = analytics?.overallPerformance ? {
    refunds: { count: 0, successRate: 0 },
    coupons: { count: 0, successRate: 0 },
    autoReplies: { count: Math.floor(analytics.overallPerformance.totalTicketsProcessed * 0.8), successRate: analytics.overallPerformance.averageSuccessRate },
    escalations: { count: Math.floor(analytics.overallPerformance.totalTicketsProcessed * 0.2), successRate: 100 },
    autoResolves: { count: Math.floor(analytics.overallPerformance.totalTicketsProcessed * 0.6), successRate: analytics.overallPerformance.averageSuccessRate }
  } : {
    refunds: { count: 0, successRate: 0 },
    coupons: { count: 0, successRate: 0 },
    autoReplies: { count: 0, successRate: 0 },
    escalations: { count: 0, successRate: 0 },
    autoResolves: { count: 0, successRate: 0 }
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return <DashboardSkeleton />;
  }

  // Show access error only after auth is loaded and user has no organization
  if (!user?.organization) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          <AlertTitle>Access Required</AlertTitle>
          You need to be part of an organization to view bot performance data.
        </Alert>
      </Box>
    );
  }

  // Show initial loading if data hasn't been fetched yet
  if (isLoading && !dashboardData && !analytics && !benchmarks) {
    return <DashboardSkeleton />;
  }

  return (
    <Box p={3} maxWidth="1600px" margin="0 auto">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom display="flex" alignItems="center" gap={1}>
            <SmartToy color="primary" />
            Bot Performance Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and optimize your AI support bot's performance in real-time
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <TimeRangeSelector 
            onTimeRangeChange={handleTimeRangeChange} 
            currentTimeRange={timeRange} 
          />
          <Tooltip title="Refresh all data (cached)">
            <IconButton onClick={handleRefresh} disabled={isLoading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Force refresh (bypass cache)">
            <IconButton onClick={handleRefreshNoCache} disabled={isLoading} color="secondary">
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Loading indicator */}
      {isLoading && (
        <Box position="fixed" top={0} left={0} right={0} zIndex={9999}>
          <LinearProgress />
        </Box>
      )}

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Analytics" />
          <Tab label="Insights & Recommendations" />
          <Tab label="Enhanced Action Plans" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={activeTab} index={0}>
        {isLoading && !dashboardData ? (
          <>
            <KPICardsSkeleton />
            <ChartsSkeleton />
          </>
        ) : (
          <>
            <Box mb={4}>
              <BotKPICards 
                kpis={kpiData} 
                isLoading={isLoading} 
                onRefresh={handleRefresh}
              />
            </Box>
            
            <Box mb={4}>
              <BotPerformanceCharts
                chartData={chartData}
                actionBreakdown={actionBreakdown}
                isLoading={isLoading}
                period={timeRange.label}
              />
            </Box>
          </>
        )}
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={activeTab} index={1}>
        {isLoading && !dashboardData && !analytics ? (
          <SummaryTabSkeleton />
        ) : (
          <>
            <Box mb={4}>
              <BotKPICards 
                kpis={kpiData} 
                isLoading={isLoading} 
                onRefresh={handleRefresh}
              />
            </Box>

            {analytics && (
              <Box mb={4}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <AlertTitle>Performance Overview</AlertTitle>
                  Your bot is showing a <strong>{analytics.overallPerformance.trend}</strong> trend with{' '}
                  <strong>{analytics.overallPerformance.totalTicketsProcessed}</strong> tickets processed and{' '}
                  <strong>{analytics.overallPerformance.averageSuccessRate.toFixed(1)}%</strong> success rate.
                </Alert>
              </Box>
            )}
            
            <BotPerformanceCharts
              chartData={chartData}
              actionBreakdown={actionBreakdown}
              isLoading={isLoading}
              period={timeRange.label}
            />
          </>
        )}
      </TabPanel>

      {/* Insights Tab */}
      <TabPanel value={activeTab} index={2}>
        {isLoading && !analytics && !dashboardStore.insights ? (
          <InsightsSkeleton />
        ) : (
          <BotInsights
            recommendations={analytics?.recommendations || []}
            predictions={analytics?.predictions || []}
            benchmarks={benchmarks}
            generalInsights={dashboardStore.insights?.futurePredictions?.map(pred => ({
              id: pred.id || Math.random().toString(),
              type: pred.category || 'prediction',
              title: pred.title,
              description: pred.prediction,
              category: pred.category || 'General',
              impact: pred.impact as 'positive' | 'negative' | 'neutral',
              confidence: pred.confidence as 'high' | 'medium' | 'low',
              timestamp: new Date().toISOString(),
              data: pred
            })) || []}
            generalRecommendations={dashboardStore.insights?.recommendations?.map(rec => ({
              id: rec.id || Math.random().toString(),
              title: rec.title,
              description: rec.description,
              priority: rec.priority as 'high' | 'medium' | 'low',
              category: rec.category || 'General',
              actionItems: rec.actionItems || [],
              estimatedImpact: rec.estimatedImpact || 'Not specified'
            })) || []}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        )}
      </TabPanel>

      {/* Enhanced Action Plans Tab */}
      <TabPanel value={activeTab} index={3}>
        {isLoading && !analytics && !dashboardStore.insights ? (
          <InsightsSkeleton />
        ) : (
          <EnhancedInsights
            days={getDaysFromTimeRange()}
            onRefresh={handleRefresh}
            useCache={lastUsedCache}
          />
        )}
      </TabPanel>

      {/* Floating Action Button for Manual Metrics Calculation */}
      <Fab
        color="secondary"
        aria-label="calculate metrics"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={handleCalculateMetrics}
        disabled={isLoading}
      >
        <Calculate />
      </Fab>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
});

export default BotPerformancePage;