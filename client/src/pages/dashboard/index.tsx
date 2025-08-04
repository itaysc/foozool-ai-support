import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import TimeRangeSelector from '@/components/TimeRangeSelector';
import { format } from 'date-fns';


const Dashboard = observer(() => {
  const { setIsLoading } = useMainLayoutContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [timeRange, setTimeRange] = useState<{
    start: Date;
    end: Date;
    label: string;
  } | undefined>(undefined);

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

  // Initialize time range from URL params on mount
  useEffect(() => {
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const labelParam = searchParams.get('label');
    
    if (startParam && endParam) {
      // Convert yyyy-mm-dd format to Date objects
      const startDate = new Date(startParam + 'T00:00:00');
      const endDate = new Date(endParam + 'T23:59:59');
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        setTimeRange({
          start: startDate,
          end: endDate,
          label: labelParam || `${format(startDate, 'yyyy-MM-dd')} - ${format(endDate, 'yyyy-MM-dd')}`
        });
        
        // Fetch data with the time range from URL (convert to ISO strings for API)
        dashboardStore.fetchAllDashboardData({
          start: startDate.toISOString(),
          end: endDate.toISOString()
        });
        return;
      }
    }
    
    // Default fetch if no valid time range in URL
    const fetchData = async () => {
      setIsLoading(true);
      await dashboardStore.fetchAllDashboardData();
      setIsLoading(false);
    };

    fetchData();
  }, [setIsLoading, searchParams]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await dashboardStore.fetchAllDashboardData();
    setIsLoading(false);
  };

  const handleTimeRangeChange = (newTimeRange: {
    start: Date;
    end: Date;
    label: string;
  }) => {
    console.log('🔄 Time range changed:', newTimeRange);
    setTimeRange(newTimeRange);
    
    // Convert dates to yyyy-mm-dd format for URL
    const startDate = format(newTimeRange.start, 'yyyy-MM-dd');
    const endDate = format(newTimeRange.end, 'yyyy-MM-dd');
    
    // For API calls, use full ISO strings
    const startISO = newTimeRange.start.toISOString();
    const endISO = newTimeRange.end.toISOString();
    
    console.log('📅 API time range:', { start: startISO, end: endISO });
    
    // Update URL parameters with date format
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('start', startDate);
    newSearchParams.set('end', endDate);
    newSearchParams.set('label', newTimeRange.label);
    setSearchParams(newSearchParams);
    
    // Clear existing data to force fresh fetch and prevent caching issues
    dashboardStore.clearData();
    
    // Update dashboard data with new time range (using ISO strings for API)
    dashboardStore.fetchAllDashboardData({
      start: startISO,
      end: endISO
    });
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

      {/* Time Range Selector */}
      <TimeRangeSelector 
        onTimeRangeChange={handleTimeRangeChange}
        currentTimeRange={timeRange}
        key={timeRange?.label || 'default'}
      />

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
                        data={toJS(intentsData)}
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
          <Box flex="1 1 500px" minWidth="500px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">
                    Volume Trend
                  </Typography>
                  {getTrendIcon(dashboardStore.metrics.volumeTrend)}
                </Box>
                                 <ResponsiveContainer width="100%" height={250}>
                   {dashboardStore.isLoading ? (
                     <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                       <CircularProgress size={40} />
                     </Box>
                   ) : dashboardStore.timeSeriesData ? (
                     <LineChart 
                       key={`volume-${dashboardStore.lastUpdated?.getTime()}-${dashboardStore.timeSeriesData?.volumeData.length || 0}`}
                       data={toJS(dashboardStore.timeSeriesData.volumeData)}
                     >
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis 
                         dataKey="date" 
                         tick={{ fontSize: 12 }}
                         interval="preserveStartEnd"
                       />
                       <YAxis 
                         tick={{ fontSize: 12 }}
                         domain={['dataMin - 10', 'dataMax + 10']}
                       />
                       <RechartsTooltip 
                         formatter={(value) => [`${value} tickets`, 'Volume']}
                         labelFormatter={(label) => {
                           // Check if the label contains time (HH:mm format)
                           if (label && typeof label === 'string') {
                             if (label.includes(':')) {
                               // Time format (HH:mm) - show as "Jul 08 12:00"
                               // Use the time range start date to get the correct date
                               const startDate = timeRange?.start || new Date();
                               const [hours, minutes] = label.split(':');
                               const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), parseInt(hours), parseInt(minutes));
                               return `Date: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${label}`;
                             } else {
                               // Date format (MMM dd) - show as "Jul 08"
                               return `Date: ${label}`;
                             }
                           }
                           return `Date: ${label}`;
                         }}
                       />
                       <Line 
                         type="monotone" 
                         dataKey="tickets" 
                         stroke="#8884d8" 
                         strokeWidth={2}
                         dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                         activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2 }}
                       />
                     </LineChart>
                   ) : (
                     <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                       <Typography variant="body2" color="text.secondary">
                         No volume data available
                       </Typography>
                     </Box>
                   )}
                 </ResponsiveContainer>
                <Typography color="text.secondary" align="center" mt={1}>
                  Ticket volume is {dashboardStore.metrics.volumeTrend}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Satisfaction Trend */}
        {dashboardStore.metrics && (
          <Box flex="1 1 500px" minWidth="500px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">
                    Satisfaction Trend
                  </Typography>
                  {getTrendIcon(dashboardStore.metrics.satisfactionTrend)}
                </Box>
                                 <ResponsiveContainer width="100%" height={250}>
                   {dashboardStore.isLoading ? (
                     <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                       <CircularProgress size={40} />
                     </Box>
                   ) : dashboardStore.timeSeriesData ? (
                     <LineChart 
                       key={`satisfaction-${dashboardStore.lastUpdated?.getTime()}-${dashboardStore.timeSeriesData?.satisfactionData.length || 0}`}
                       data={toJS(dashboardStore.timeSeriesData.satisfactionData)}
                     >
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis 
                         dataKey="date" 
                         tick={{ fontSize: 12 }}
                         interval="preserveStartEnd"
                       />
                       <YAxis 
                         tick={{ fontSize: 12 }}
                         domain={[0, 100]}
                         tickFormatter={(value) => `${value}%`}
                       />
                       <RechartsTooltip 
                         formatter={(value) => [`${value}%`, 'Satisfaction']}
                         labelFormatter={(label) => {
                           // Check if the label contains time (HH:mm format)
                           if (label && typeof label === 'string') {
                             if (label.includes(':')) {
                               // Time format (HH:mm) - show as "Jul 08 12:00"
                               // Use the time range start date to get the correct date
                               const startDate = timeRange?.start || new Date();
                               const [hours, minutes] = label.split(':');
                               const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), parseInt(hours), parseInt(minutes));
                               return `Date: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${label}`;
                             } else {
                               // Date format (MMM dd) - show as "Jul 08"
                               return `Date: ${label}`;
                             }
                           }
                           return `Date: ${label}`;
                         }}
                       />
                       <Line 
                         type="monotone" 
                         dataKey="satisfaction" 
                         stroke="#82ca9d" 
                         strokeWidth={2}
                         dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
                         activeDot={{ r: 6, stroke: '#82ca9d', strokeWidth: 2 }}
                       />
                     </LineChart>
                   ) : (
                     <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                       <Typography variant="body2" color="text.secondary">
                         No satisfaction data available
                       </Typography>
                     </Box>
                   )}
                 </ResponsiveContainer>
                <Typography color="text.secondary" align="center" mt={1}>
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