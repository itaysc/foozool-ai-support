import React, { useEffect } from 'react';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning,
  Error,
  Info,
  CheckCircle,
  Refresh,
  Timeline,
  Assessment,
  Notifications,
  Speed
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import dashboardStore from '@/stores/dashboard.store';
import { useMainLayoutContext } from '@/context/mainLayout.context';


const Dashboard = observer(() => {
  const { setIsLoading } = useMainLayoutContext();

  // Debug: Log the metrics data structure
  React.useEffect(() => {
    if (dashboardStore.metrics) {
      console.log('Dashboard Metrics:', toJS(dashboardStore.metrics));
      console.log('Top Intents:', toJS(dashboardStore.metrics.topIntents));
      console.log('Sentiment Breakdown:', toJS(dashboardStore.metrics.sentimentBreakdown));
      
      // Debug individual items
      if (dashboardStore.metrics.topIntents && dashboardStore.metrics.topIntents.length > 0) {
        console.log('First intent item:', toJS(dashboardStore.metrics.topIntents[0]));
        console.log('Intent item keys:', Object.keys(toJS(dashboardStore.metrics.topIntents[0])));
      }
    }
  }, [dashboardStore.metrics]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await dashboardStore.fetchAllDashboardData();
      setIsLoading(false);
    };

    fetchData();
  }, [setIsLoading]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await dashboardStore.fetchAllDashboardData();
    setIsLoading(false);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp color="success" />;
      case 'decreasing':
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="action" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Error />;
      case 'high':
        return <Warning />;
      case 'medium':
        return <Info />;
      default:
        return <CheckCircle />;
    }
  };

  if (dashboardStore.isLoading && !dashboardStore.hasData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (dashboardStore.error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Error</AlertTitle>
        {dashboardStore.error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Dashboard
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {dashboardStore.lastUpdated && (
            <Typography variant="body2" color="text.secondary">
              Last updated: {dashboardStore.lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={dashboardStore.isLoading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Alerts Section */}
      {dashboardStore.alerts.length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" mb={2} display="flex" alignItems="center" gap={1}>
            <Notifications color="warning" />
            Alerts ({dashboardStore.totalAlerts})
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
                                {toJS(dashboardStore.alerts).slice(0, 3).map((alert) => (
              <Box key={alert.id} flex="1 1 300px" minWidth="300px">
                <Alert 
                  severity={getSeverityColor(alert.severity) as any}
                  icon={getSeverityIcon(alert.severity)}
                  sx={{ height: '100%' }}
                >
                  <AlertTitle>{alert.title}</AlertTitle>
                  {alert.description}
                </Alert>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Key Metrics */}
      {dashboardStore.metrics && (
        <Box display="flex" flexWrap="wrap" gap={3} mb={3}>
          <Box flex="1 1 250px" minWidth="250px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Tickets
                    </Typography>
                    <Typography variant="h4" component="div">
                      {dashboardStore.metrics.totalTickets.toLocaleString()}
                    </Typography>
                  </Box>
                  <Timeline color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box flex="1 1 250px" minWidth="250px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Recent Tickets (7d)
                    </Typography>
                    <Typography variant="h4" component="div">
                      {dashboardStore.metrics.recentTickets.toLocaleString()}
                    </Typography>
                  </Box>
                  <Assessment color="secondary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box flex="1 1 250px" minWidth="250px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Active Insights
                    </Typography>
                    <Typography variant="h4" component="div">
                      {dashboardStore.metrics.activeInsights}
                    </Typography>
                  </Box>
                  <Speed color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box flex="1 1 250px" minWidth="250px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      High Priority
                    </Typography>
                    <Typography variant="h4" component="div">
                      {dashboardStore.metrics.highPriorityInsights}
                    </Typography>
                  </Box>
                  <Warning color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Charts Section */}
      <Box display="flex" flexWrap="wrap" gap={3} mb={3}>
        {/* Sentiment Distribution */}
        {dashboardStore.metrics && dashboardStore.metrics.sentimentBreakdown && (
          <Box flex="1 1 500px" minWidth="500px">
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sentiment Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {(() => {
                    const sentimentData = toJS([
                      { name: 'Positive', value: dashboardStore.metrics.sentimentBreakdown.positive || 0, color: '#4caf50' },
                      { name: 'Neutral', value: dashboardStore.metrics.sentimentBreakdown.neutral || 0, color: '#ff9800' },
                      { name: 'Negative', value: dashboardStore.metrics.sentimentBreakdown.negative || 0, color: '#f44336' }
                    ]);
                    
                    const totalSentiment = sentimentData.reduce((sum, item) => sum + item.value, 0);
                    
                    if (totalSentiment === 0) {
                      return (
                        <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                          <Typography variant="body2" color="text.secondary">
                            No sentiment data available
                          </Typography>
                        </Box>
                      );
                    }
                    
                    return (
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false} // Disable labels on pie segments to prevent overlap
                          outerRadius={60}
                          innerRadius={20}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value, name) => [`${value} tickets`, name]}
                          labelFormatter={(label) => `${label} Sentiment`}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value, entry) => (
                            <span style={{ color: entry.color }}>
                              {value} ({sentimentData.find(item => item.name === value)?.value || 0} tickets)
                            </span>
                          )}
                        />
                      </PieChart>
                    );
                  })()}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Top Intents */}
        {dashboardStore.metrics && dashboardStore.metrics.topIntents && dashboardStore.metrics.topIntents.length > 0 && (
          <Box flex="1 1 500px" minWidth="500px">
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Intents
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {(() => {
                    const rawIntents = toJS(dashboardStore.metrics.topIntents);
                    console.log('Raw intents data:', rawIntents);
                    
                    // Handle different possible data structures
                    const intentsData = rawIntents.map((item: any, index) => {
                      console.log(`Processing intent item ${index}:`, item);
                      
                      // Try different possible property names
                      const intentName = item.intent || item.name || item.label || item.key || `Intent ${index + 1}`;
                      const intentCount = item.count || item.value || item.amount || 0;
                      const intentPercentage = item.percentage || item.percent || 0;
                      
                      return {
                        intent: String(intentName),
                        count: Number(intentCount),
                        percentage: Number(intentPercentage)
                      };
                    });
                    
                    console.log('Processed intents data:', intentsData);
                    
                    if (intentsData.length === 0 || intentsData.every(item => item.count === 0)) {
                      return (
                        <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                          <Typography variant="body2" color="text.secondary">
                            No intent data available
                          </Typography>
                        </Box>
                      );
                    }
                    
                    return (
                      <BarChart 
                        data={intentsData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="intent" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <RechartsTooltip 
                          formatter={(value, name) => [
                            name === 'count' ? `${value} tickets` : `${value}%`, 
                            name === 'count' ? 'Count' : 'Percentage'
                          ]}
                          labelFormatter={(label) => `Intent: ${label}`}
                        />
                        <Bar dataKey="count" fill="#8884d8" name="Count" />
                      </BarChart>
                    );
                  })()}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>

      {/* Trends and Performance */}
      <Box display="flex" flexWrap="wrap" gap={3} mb={3}>
        {/* Volume Trend */}
        {dashboardStore.metrics && (
          <Box flex="1 1 400px" minWidth="400px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">
                    Volume Trend
                  </Typography>
                  {getTrendIcon(dashboardStore.metrics.volumeTrend)}
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h4">
                    {dashboardStore.metrics.volumeTrend.charAt(0).toUpperCase() + dashboardStore.metrics.volumeTrend.slice(1)}
                  </Typography>
                </Box>
                <Typography color="text.secondary">
                  Ticket volume is {dashboardStore.metrics.volumeTrend}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Satisfaction Trend */}
        {dashboardStore.metrics && (
          <Box flex="1 1 400px" minWidth="400px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">
                    Satisfaction Trend
                  </Typography>
                  {getTrendIcon(dashboardStore.metrics.satisfactionTrend)}
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h4">
                    {dashboardStore.metrics.satisfactionTrend.charAt(0).toUpperCase() + dashboardStore.metrics.satisfactionTrend.slice(1)}
                  </Typography>
                </Box>
                <Typography color="text.secondary">
                  Customer satisfaction is {dashboardStore.metrics.satisfactionTrend}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>

      {/* Insights Section */}
      {dashboardStore.insights && (
        <Box display="flex" flexWrap="wrap" gap={3}>
          {/* Top Issues */}
          {dashboardStore.insights.topIssues.length > 0 && (
            <Box flex="1 1 500px" minWidth="500px">
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Issues
                  </Typography>
                  <List>
                    {toJS(dashboardStore.insights.topIssues).slice(0, 5).map((issue, index) => (
                      <ListItem key={index} divider>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: getSeverityColor(issue.severity) + '.main', width: 32, height: 32 }}>
                            {index + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={issue.title}
                          secondary={issue.description}
                        />
                        <Box display="flex" gap={1} mt={1}>
                          <Chip 
                            label={issue.severity} 
                            size="small" 
                            color={getSeverityColor(issue.severity) as any}
                          />
                          <Chip 
                            label={`${issue.affectedTickets} tickets`} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Recommendations */}
          {dashboardStore.insights.recommendations.length > 0 && (
            <Box flex="1 1 500px" minWidth="500px">
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recommendations
                  </Typography>
                  <List>
                    {toJS(dashboardStore.insights.recommendations).slice(0, 5).map((rec, index) => (
                      <ListItem key={index} divider>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            {index + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={rec.title}
                          secondary={rec.description}
                        />
                        <Box display="flex" flexDirection="column" gap={1}>
                          <Chip 
                            label={rec.priority} 
                            size="small" 
                            color={getSeverityColor(rec.priority) as any}
                          />
                          {rec.actionItems.length > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              Actions: {rec.actionItems.slice(0, 2).join(', ')}
                              {rec.actionItems.length > 2 && '...'}
                            </Typography>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      )}

      {/* Loading indicator for refresh */}
      {dashboardStore.isLoading && (
        <Box position="fixed" top={0} left={0} right={0} zIndex={9999}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
});

export default Dashboard;