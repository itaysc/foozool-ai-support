import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Alert,
  AlertTitle,
  LinearProgress,
  IconButton,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Info,
  Refresh,
  Psychology,
  Analytics,
  TrendingDown,
  Speed
} from '@mui/icons-material';
import dashboardStore from '@/stores/dashboard.store';
import { useAuth } from '@/context/auth.context';
import TimeRangeSelector from '@/components/TimeRangeSelector';

const Insights = observer(() => {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.organization) {
      fetchData();
    }
  }, [user?.organization]);

  const fetchData = async () => {
    if (user?.organization) {
      await Promise.all([
        dashboardStore.fetchOptimizedDashboardData(undefined, true), // Always use cache by default
        dashboardStore.fetchEnrichedTickets({ 
          useCache: true,
          limit: 100 // Limit to 100 tickets for better insights and performance
        }) // Always use cache by default
      ]);
    }
  };

  const handleRefresh = async () => {
    await fetchData();
  };

  const handleTimeRangeChange = (newTimeRange: {
    start: Date;
    end: Date;
    label: string;
  }) => {
    // Convert dates to ISO strings for the API
    const timeRange = {
      start: newTimeRange.start.toISOString(),
      end: newTimeRange.end.toISOString(),
    };
    
    // Clear existing data and reset first load flags to force fresh fetch
    dashboardStore.clearData();
    
    // Update dashboard data with new time range
    dashboardStore.fetchOptimizedDashboardData(timeRange);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <Error color="error" />;
      case 'high':
        return <Warning color="warning" />;
      case 'medium':
        return <Info color="info" />;
      case 'low':
        return <CheckCircle color="success" />;
      default:
        return <Info />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'increasing':
        return <TrendingUp color="success" />;
      case 'decreasing':
        return <TrendingDown color="error" />;
      case 'stable':
        return <Speed color="info" />;
      default:
        return <Analytics />;
    }
  };

  if (!user?.organization) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          <AlertTitle>Access Required</AlertTitle>
          You need to be part of an organization to view insights.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth="1400px" margin="0 auto">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Insights & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover patterns, predictions, and actionable recommendations from your data
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <TimeRangeSelector onTimeRangeChange={handleTimeRangeChange} />
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={dashboardStore.isLoading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fetch data without cache">
            <IconButton 
              onClick={async () => {
                try {
                  // Fetch data without cache
                  await Promise.all([
                    dashboardStore.fetchOptimizedDashboardData(undefined, false),
                    dashboardStore.fetchEnrichedTickets({ 
                      useCache: false,
                      limit: 100 // Keep consistent limit for insights
                    })
                  ]);
                } catch (error) {
                  console.error('Error fetching data without cache:', error);
                }
              }} 
              disabled={dashboardStore.isLoading}
              color="warning"
            >
              <Refresh color="warning" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Loading indicator */}
      {dashboardStore.isLoading && (
        <Box position="fixed" top={0} left={0} right={0} zIndex={9999}>
          <LinearProgress />
        </Box>
      )}

      {/* Error state */}
      {dashboardStore.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {dashboardStore.error}
        </Alert>
      )}

      {/* Insights Grid */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '2fr 1fr' }} gap={3}>
        {/* Future Predictions */}
        {dashboardStore.insights?.futurePredictions && dashboardStore.insights.futurePredictions.length > 0 && (
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <Timeline color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Future Predictions
                  </Typography>
                  <Chip 
                    label={`${dashboardStore.insights.futurePredictions.length} predictions`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                <Box>
                  {toJS(dashboardStore.insights.futurePredictions).slice(0, 5).map((prediction, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        borderBottom: '1px solid #e0e0e0',
                        py: 3,
                        '&:last-child': { borderBottom: 'none' }
                      }}
                    >
                      <Box display="flex" alignItems="flex-start" width="100%">
                        {/* Prediction Number */}
                        <Box sx={{ width: 50, display: 'flex', justifyContent: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: prediction.impact === 'negative' ? 'error.main' : 
                                       prediction.impact === 'positive' ? 'success.main' : 'info.main', 
                              width: 32, 
                              height: 32
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        </Box>
                        
                        {/* Prediction Content */}
                        <Box sx={{ flex: 1, px: 2 }}>
                          <Typography variant="subtitle1" fontWeight="medium" color="primary">
                            {prediction.title}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1, mb: 1.5 }}>
                            <strong>Prediction:</strong> {prediction.prediction}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            <strong>Reasoning:</strong> {prediction.reasoning}
                          </Typography>
                          
                          {/* Suggested Actions */}
                          {prediction.suggestedActions && prediction.suggestedActions.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" fontWeight="medium" color="text.secondary" sx={{ mb: 1 }}>
                                Suggested Actions:
                              </Typography>
                              <Box display="flex" flexWrap="wrap" gap={1}>
                                {prediction.suggestedActions.slice(0, 3).map((action, actionIndex) => (
                                  <Chip 
                                    key={actionIndex}
                                    label={action} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ 
                                      fontSize: '0.75rem',
                                      maxWidth: '200px'
                                    }}
                                  />
                                ))}
                                {prediction.suggestedActions.length > 3 && (
                                  <Chip 
                                    label={`+${prediction.suggestedActions.length - 3} more`} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ fontSize: '0.75rem' }}
                                  />
                                )}
                              </Box>
                            </Box>
                          )}
                        </Box>
                        
                        {/* Prediction Metadata */}
                        <Box sx={{ width: 120, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {/* Confidence */}
                          <Chip 
                            label={`${prediction.confidence} confidence`} 
                            size="small" 
                            color={prediction.confidence === 'high' ? 'success' : 
                                   prediction.confidence === 'medium' ? 'warning' : 'default'}
                            sx={{ fontSize: '0.7rem' }}
                          />
                          
                          {/* Timeframe */}
                          <Chip 
                            label={prediction.timeframe} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                          
                          {/* Category */}
                          <Chip 
                            label={prediction.category.replace('_', ' ')} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Recommendations */}
        {dashboardStore.insights?.recommendations && dashboardStore.insights.recommendations.length > 0 && (
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <Analytics color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Recommendations
                  </Typography>
                  <Chip 
                    label={`${dashboardStore.insights.recommendations.length} recommendations`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                <Box>
                  {toJS(dashboardStore.insights.recommendations).slice(0, 5).map((rec, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        borderBottom: '1px solid #e0e0e0',
                        py: 2,
                        '&:last-child': { borderBottom: 'none' }
                      }}
                    >
                      <Box display="flex" alignItems="flex-start" width="100%">
                        {/* Number */}
                        <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: 'primary.main', 
                              width: 28, 
                              height: 28,
                              fontSize: '0.8rem'
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        </Box>
                        
                        {/* Content */}
                        <Box sx={{ flex: 1, px: 1.5 }}>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {rec.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1, fontSize: '0.85rem' }}>
                            {rec.description}
                          </Typography>
                          {rec.actionItems.length > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              Actions: {rec.actionItems.slice(0, 2).join(', ')}
                              {rec.actionItems.length > 2 && '...'}
                            </Typography>
                          )}
                        </Box>
                        
                        {/* Priority Tag */}
                        <Box sx={{ width: 70, display: 'flex', justifyContent: 'center' }}>
                          <Chip 
                            label={rec.priority} 
                            size="small" 
                            color={getSeverityColor(rec.priority) as any}
                            sx={{ 
                              width: 60, 
                              height: 24,
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>

      {/* Anomalies & Insights Section */}
      {dashboardStore.metrics?.userAgentAnalytics?.anomalies && dashboardStore.metrics.userAgentAnalytics.anomalies.length > 0 && (
        <Box mt={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <Psychology color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Anomalies & Insights
                </Typography>
                <Chip 
                  label={`${dashboardStore.metrics.userAgentAnalytics.anomalies.length} anomalies`} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
                {dashboardStore.metrics.userAgentAnalytics.anomalies.map((anomaly, index) => (
                  <Box key={index}>
                    <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                      <Box display="flex" alignItems="flex-start" gap={2}>
                        <Box sx={{ mt: 0.5 }}>
                          {getSeverityIcon(anomaly.severity)}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                            {anomaly.title || `Anomaly ${index + 1}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {anomaly.description || 'Anomaly detected in user behavior patterns'}
                          </Typography>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            <Chip 
                              label={anomaly.severity} 
                              size="small" 
                              color={getSeverityColor(anomaly.severity) as any}
                              variant="outlined"
                            />

                          </Box>
                        </Box>
                                              </Box>
                      </Paper>
                    </Box>
                  ))}
                </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Enriched Tickets Section */}
      <Box mt={4}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Analytics color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Enriched Tickets Data
                </Typography>
                <Chip 
                  label={`${dashboardStore.enrichedTickets.length} tickets`} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton 
                  onClick={() => dashboardStore.refreshEnrichedTickets()} 
                  disabled={dashboardStore.isLoading}
                  title="Refresh enriched tickets data (no cache)"
                >
                  <Refresh />
                </IconButton>
              </Box>
            </Box>
            
            {/* Optimization Note */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>Optimized for Insights</AlertTitle>
              This section displays a sample of {dashboardStore.enrichedTickets.length} tickets to provide focused insights and predictions. 
              For comprehensive data analysis, use the dashboard metrics or adjust the time range.
            </Alert>
            
            {dashboardStore.enrichedTickets.length > 0 ? (
              <Box display="flex" flexWrap="wrap" gap={2}>
                {dashboardStore.enrichedTickets.slice(0, 6).map((ticket, index) => (
                  <Box key={index} sx={{ width: { xs: '100%', md: 'calc(50% - 8px)', lg: 'calc(33.333% - 8px)' } }}>
                    <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                          {ticket.payload?.subject?.substring(0, 60) || 'No subject'}...
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {ticket.payload?.description?.substring(0, 100) || 'No description'}...
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                          <Chip 
                            label={ticket.payload?.status || 'unknown'} 
                            size="small" 
                            color={ticket.payload?.status === 'solved' ? 'success' : 'warning'} 
                            variant="outlined"
                          />
                          {ticket.payload?.tags?.slice(0, 2).map((tag, tagIndex) => (
                            <Chip 
                              key={tagIndex}
                              label={tag} 
                              size="small" 
                              variant="outlined"
                            />
                          ))}
                        </Box>
                        {ticket.zendeskData && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Priority: {ticket.zendeskData.priority}
                            </Typography>
                            {ticket.zendeskData.comments && ticket.zendeskData.comments.length > 0 && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Comments: {ticket.zendeskData.comments.length}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box textAlign="center" py={3}>
                <Typography variant="body2" color="text.secondary">
                  No enriched tickets data available. Click the refresh button to fetch data.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* No Data State */}
      {!dashboardStore.isLoading && 
       !dashboardStore.insights?.futurePredictions?.length && 
       !dashboardStore.insights?.recommendations?.length && 
       !dashboardStore.metrics?.userAgentAnalytics?.anomalies?.length && (
        <Box mt={4} textAlign="center">
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Insights Available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Insights will appear here as your system analyzes more data. Try changing the time range or refreshing.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
});

export default Insights;