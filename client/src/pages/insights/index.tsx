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
  Grid,
  Alert,
  AlertTitle,
  LinearProgress,
  IconButton,
  Paper
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
      await dashboardStore.fetchOptimizedDashboardData();
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
            AI Insights & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover patterns, predictions, and actionable recommendations from your data
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <TimeRangeSelector onTimeRangeChange={handleTimeRangeChange} />
          <IconButton onClick={handleRefresh} disabled={dashboardStore.isLoading}>
            <Refresh />
          </IconButton>
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
      <Grid container spacing={3}>
        {/* Future Predictions */}
        {dashboardStore.insights?.futurePredictions && dashboardStore.insights.futurePredictions.length > 0 && (
          <Grid item xs={12} lg={8}>
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
          </Grid>
        )}

        {/* Recommendations */}
        {dashboardStore.insights?.recommendations && dashboardStore.insights.recommendations.length > 0 && (
          <Grid item xs={12} lg={4}>
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
          </Grid>
        )}
      </Grid>

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
              <Grid container spacing={2}>
                {dashboardStore.metrics.userAgentAnalytics.anomalies.map((anomaly, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                      <Box display="flex" alignItems="flex-start" gap={2}>
                        <Box sx={{ mt: 0.5 }}>
                          {getSeverityIcon(anomaly.severity)}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                            {anomaly.title || `Anomaly ${index + 1}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            {anomaly.description || `Anomaly of type: ${anomaly.type}`}
                          </Typography>
                          <Box display="flex" gap={1}>
                            <Chip
                              label={anomaly.severity}
                              size="small"
                              color={getSeverityColor(anomaly.severity) as any}
                              sx={{ fontSize: '0.7rem' }}
                            />
                            <Chip
                              label={anomaly.type}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Empty State */}
      {(!dashboardStore.insights || 
        (!dashboardStore.insights.futurePredictions?.length && 
         !dashboardStore.insights.recommendations?.length)) && 
       (!dashboardStore.metrics?.userAgentAnalytics?.anomalies?.length) && (
        <Box mt={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                <Analytics sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Insights Available
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Insights will appear here as we analyze your data and identify patterns, predictions, and recommendations.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
});

export default Insights; 