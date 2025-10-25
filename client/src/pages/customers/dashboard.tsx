import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  AttachMoney,
  Assessment,
  Warning,
  CheckCircle,
  Schedule,
  People,
  Support,
  Lightbulb,
  Refresh,
  CalendarToday,
  Person,
  Business,
  Group,
  Payment,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  LineChart,
  AreaChart,
  Area,
} from 'recharts';
import { observer } from 'mobx-react';
import customersStore from '@/stores/customers.store';
import customersService from '@/services/customers-service';
import { ICustomer } from '@/types';

const COLORS = {
  primary: '#3b82f6',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#0891b2',
  purple: '#7c3aed',
  pink: '#db2777',
  // Traditional muted chart colors - professional and easy on the eyes
  chart: {
    recurring: '#6b7280',      // Gray-500
    ticketVolume: '#374151',   // Gray-700
    sentiment: '#9ca3af',      // Gray-400
    escalating: '#4b5563',     // Gray-600
    resolution: '#d1d5db',     // Gray-300
    other: '#f3f4f6',          // Gray-100
    churn: '#7c2d12',          // Red-900
    engagement: '#1e40af',     // Blue-800
    satisfaction: '#166534',   // Green-800
    performance: '#92400e',    // Amber-800
    support: '#991b1b',        // Red-800
    technical: '#1e3a8a',      // Blue-900
    billing: '#365314',        // Lime-800
    feature: '#9a3412',        // Orange-800
    onboarding: '#be185d',     // Pink-800
    retention: '#134e4a',      // Teal-800
    upsell: '#581c87',         // Purple-900
    compliance: '#374151',     // Gray-700
    security: '#7f1d1d',       // Red-900
    integration: '#14532d',    // Green-900
  },
  // Status colors
  status: {
    active: '#dc2626',         // Red for active issues
    resolved: '#059669',       // Green for resolved
    in_progress: '#d97706',    // Orange for in progress
    pending: '#0891b2',        // Blue for pending
  },
  // Severity colors - matching insights page severity values
  severity: {
    red: '#dc2626',           // Red for critical/high severity
    yellow: '#d97706',        // Yellow/Orange for warning/medium severity  
    info: '#0891b2',          // Blue for info/low severity
    green: '#16a34a',         // Green for resolved/good status
  }
};

const CustomerDashboardPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [insightsAnalytics, setInsightsAnalytics] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any>(null);
  const [activityAnalytics, setActivityAnalytics] = useState<any>(null);
  const [selectedActivity, setSelectedActivity] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [customerId]);

  const loadDashboardData = async () => {
    if (!customerId) {
      setError('No customer ID provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Load dashboard data, insights analytics, payment history, and activity analytics in parallel
      const [dashboardData, analyticsData, paymentData, activityData] = await Promise.all([
        customersStore.fetchDashboardData(customerId).then(() => customersStore.dashboardData),
        customersService.getInsightsAnalytics(customerId).catch(err => {
          console.warn('Failed to fetch insights analytics:', err);
          return null;
        }),
        customersService.getPaymentHistory(customerId).catch(err => {
          console.warn('Failed to fetch payment history:', err);
          return null;
        }),
        customersService.getActivityAnalytics(customerId).catch(err => {
          console.warn('Failed to fetch activity analytics:', err);
          return null;
        })
      ]);
      
      if (dashboardData) {
        setCustomer(dashboardData.customer);
        setInsights(dashboardData.insights || []);
      } else {
        setError('Customer not found');
      }
      
      setInsightsAnalytics(analyticsData);
      setPaymentHistory(paymentData);
      setActivityAnalytics(activityData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const getHealthScoreColor = (score?: number): string => {
    if (!score) return COLORS.info;
    if (score >= 8) return COLORS.success;
    if (score >= 6) return COLORS.warning;
    return COLORS.error;
  };

  const getHealthScoreLabel = (score?: number): string => {
    if (!score) return 'Not Set';
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  };

  const getInsightTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      'recurring_problems': 'Recurring Problems',
      'high_ticket_volume': 'High Ticket Volume',
      'sentiment_decline': 'Sentiment Decline',
      'escalating_issues': 'Escalating Issues',
      'resolution_delays': 'Resolution Delays',
      'other': 'Other Insights'
    };
    return labels[type] || type;
  };

  const getMostCommonInsightType = (): string => {
    return customersStore.dashboardData?.summary?.mostCommonType || 'None';
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }

  if (!customer) {
    return (
      <Alert severity="info" sx={{ mt: 4 }}>
        No customer data available.
      </Alert>
    );
  }

  const healthScoreColor = getHealthScoreColor(customer.healthScore);
  
  // Use chart data from the insights analytics API response
  const insightsChartData = insightsAnalytics?.chartData || [];
  const insightsStatusChartData = insightsAnalytics?.statusChartData || [];
  const insightsSeverityChartData = insightsAnalytics?.severityChartData || [];
  
  // Get insight types, status types, and severity types from analytics data for dynamic chart rendering
  const insightTypes = insightsAnalytics?.insightTypes || [];
  const statusTypes = insightsAnalytics?.statusTypes || [];
  const severityTypes = insightsAnalytics?.severityTypes || [];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button
            onClick={() => navigate('/dashboard/customers')}
            startIcon={<ArrowBack />}
            variant="text"
            sx={{ mb: 2, color: 'text.secondary', p: 0 }}
          >
            Back to Customers
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {customer.name} Dashboard
            </Typography>
            {customer.healthScore !== undefined && (
              <Chip
                label={`${customer.healthScore} - ${getHealthScoreLabel(customer.healthScore)}`}
                color={getHealthScoreColor(customer.healthScore) === COLORS.success ? 'success' : 
                       getHealthScoreColor(customer.healthScore) === COLORS.warning ? 'warning' : 'error'}
                size="medium"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {customer.segment && (
              <Chip icon={<Business />} label={customer.segment} variant="outlined" size="small" />
            )}
            {customer.industry && (
              <Chip icon={<Group />} label={customer.industry} variant="outlined" size="small" />
            )}
            {customer.companySize && (
              <Chip icon={<People />} label={customer.companySize} variant="outlined" size="small" />
            )}
          </Box>
        </Box>
        <Box display="flex" gap={1.5}>
          <Button
            variant="outlined"
            startIcon={isRefreshing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="large"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Person />}
            onClick={() => navigate(`/dashboard/customers/${customer._id}`)}
            size="large"
          >
            View Profile
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {/* Health Score */}
        <Paper sx={{ 
          p: 2, 
          flex: 1, 
          minWidth: '200px',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: 1,
          '&:hover': { boxShadow: 3 }
        }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 1.5, 
            bgcolor: `${healthScoreColor}15`, 
            color: healthScoreColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Assessment sx={{ fontSize: 24 }} />
          </Box>
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Health Score
            </Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>
              {customer.healthScore ? `${customer.healthScore}/10` : 'Not Set'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {getHealthScoreLabel(customer.healthScore)}
            </Typography>
          </Box>
        </Paper>

        {/* MRR */}
        <Paper sx={{ 
          p: 2, 
          flex: 1, 
          minWidth: '200px',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: 1,
          '&:hover': { boxShadow: 3 }
        }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 1.5, 
            bgcolor: `${COLORS.success}15`, 
            color: COLORS.success,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AttachMoney sx={{ fontSize: 24 }} />
          </Box>
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Monthly Revenue
            </Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>
              {customer.financialMetrics?.monthlyRecurringRevenue 
                ? `$${(customer.financialMetrics.monthlyRecurringRevenue / 1000).toFixed(1)}k`
                : 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {customer.financialMetrics?.annualRecurringRevenue 
                ? `$${(customer.financialMetrics.annualRecurringRevenue / 1000).toFixed(0)}k ARR`
                : 'No ARR data'}
            </Typography>
          </Box>
        </Paper>

        {/* Active Users */}
        <Paper sx={{ 
          p: 2, 
          flex: 1, 
          minWidth: '200px',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: 1,
          '&:hover': { boxShadow: 3 }
        }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 1.5, 
            bgcolor: `${COLORS.primary}15`, 
            color: COLORS.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <People sx={{ fontSize: 24 }} />
          </Box>
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Active Users
            </Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>
              {customer.usageData?.activeUsersCount || 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {customer.usageData?.seatsPurchased ? `of ${customer.usageData.seatsPurchased} seats` : 'No seat data'}
            </Typography>
          </Box>
        </Paper>

        {/* Contract Status */}
        <Paper sx={{ 
          p: 2, 
          flex: 1, 
          minWidth: '200px',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: 1,
          '&:hover': { boxShadow: 3 }
        }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 1.5, 
            bgcolor: `${COLORS.info}15`, 
            color: COLORS.info,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CalendarToday sx={{ fontSize: 24 }} />
          </Box>
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Contract Status
            </Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>
              {customer.financialMetrics?.contractRenewalDate 
                ? new Date(customer.financialMetrics.contractRenewalDate).toLocaleDateString()
                : 'No date set'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {customer.financialMetrics?.contractRenewalDate 
                ? `${Math.ceil((new Date(customer.financialMetrics.contractRenewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining`
                : 'Renewal date unknown'}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Charts Row 1 - Insights by Type and Status */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        {/* Insights Analytics Chart */}
        <Paper sx={{ p: 3, boxShadow: 2, flex: '0 0 calc(50% - 12px)', minWidth: '400px' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lightbulb sx={{ fontSize: 20 }} />
            Customer Insights Generated Over Time
          </Typography>
          <Box sx={{ height: 250, width: '100%' }}>
          {insightsChartData.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" color="text.secondary">
                No Insights Data Available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Insights will appear here once they are generated for this customer.
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={insightsChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeWidth={0.5} />
              <XAxis 
                dataKey="period" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '14px',
                  zIndex: 9999
                }}
                formatter={(value, name) => [value, getInsightTypeLabel(name as string)]}
                labelFormatter={(label) => `Period: ${label}`}
              />
              {insightTypes.map((type: string, index: number) => {
                const colorKeys = Object.keys(COLORS.chart);
                
                // Try to match insight type to a semantically appropriate color first
                let colorKey = colorKeys.find(key => 
                  key.toLowerCase().includes(type.toLowerCase()) ||
                  type.toLowerCase().includes(key.toLowerCase())
                );
                
                // If no semantic match, use index-based assignment with better distribution
                if (!colorKey) {
                  colorKey = colorKeys[index % colorKeys.length];
                }
                
                const color = COLORS.chart[colorKey as keyof typeof COLORS.chart];
                return (
                  <Bar 
                    key={type}
                    dataKey={type} 
                    stackId="a" 
                    fill={color} 
                    name={getInsightTypeLabel(type)} 
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
          )}
        </Box>
        </Paper>

        {/* Insights Status Chart */}
        <Paper sx={{ p: 3, boxShadow: 2, flex: '0 0 calc(50% - 12px)', minWidth: '400px' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment sx={{ fontSize: 20 }} />
            Insights by Status Over Time
          </Typography>
          <Box sx={{ height: 250, width: '100%' }}>
          {insightsStatusChartData.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" color="text.secondary">
                No Status Data Available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status information will appear here once insights are generated.
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={insightsStatusChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeWidth={0.5} />
              <XAxis 
                dataKey="period" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '14px',
                  zIndex: 9999
                }}
                formatter={(value, name) => {
                  const formattedName = (name as string).charAt(0).toUpperCase() + (name as string).slice(1).replace('_', ' ');
                  return [value, formattedName];
                }}
                labelFormatter={(label) => `Period: ${label}`}
              />
              {statusTypes.map((status: string, index: number) => {
                const statusColorKeys = Object.keys(COLORS.status);
                const colorKey = statusColorKeys[index % statusColorKeys.length];
                const color = COLORS.status[colorKey as keyof typeof COLORS.status];
                return (
                  <Bar 
                    key={status}
                    dataKey={status} 
                    stackId="a" 
                    fill={color} 
                    name={status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')} 
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
          )}
        </Box>
        </Paper>
      </Box>

      {/* Charts Row 2 - Insights by Severity and Payment */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <Paper sx={{ p: 3, boxShadow: 2, flex: '0 0 calc(50% - 12px)', minWidth: '400px' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning sx={{ fontSize: 20 }} />
            Insights by Severity Over Time
          </Typography>
        <Box sx={{ height: 250, width: '100%' }}>
          {insightsSeverityChartData.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" color="text.secondary">
                No Severity Data Available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Severity information will appear here once insights are generated.
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={insightsSeverityChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeWidth={0.5} />
              <XAxis 
                dataKey="period" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '14px',
                  zIndex: 9999
                }}
                formatter={(value, name) => {
                  const severityLabels: { [key: string]: string } = {
                    'red': 'Critical',
                    'yellow': 'Warning',
                    'info': 'Info',
                    'green': 'Resolved'
                  };
                  return [value, severityLabels[name as string] || (name as string).charAt(0).toUpperCase() + (name as string).slice(1)];
                }}
                labelFormatter={(label) => `Period: ${label}`}
              />
              {severityTypes.map((severity: string, index: number) => {
                const severityColorKeys = Object.keys(COLORS.severity);
                const colorKey = severityColorKeys[index % severityColorKeys.length];
                const color = COLORS.severity[colorKey as keyof typeof COLORS.severity];
                return (
                  <Area 
                    key={severity}
                    type="monotone"
                    dataKey={severity} 
                    stackId="1"
                    stroke={color}
                    fill={color}
                    fillOpacity={0.6}
                    name={severity === 'red' ? 'Critical' : 
                          severity === 'yellow' ? 'Warning' : 
                          severity === 'info' ? 'Info' : 
                          severity === 'green' ? 'Resolved' : 
                          severity.charAt(0).toUpperCase() + severity.slice(1)}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
          )}
        </Box>
        </Paper>
        <Paper sx={{ p: 3, boxShadow: 2, flex: '0 0 calc(50% - 12px)', minWidth: '400px' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Payment sx={{ fontSize: 20 }} />
            Recent Payment History
          </Typography>
          <Box sx={{ height: 300, width: '100%', overflow: 'auto' }}>
            {!paymentHistory || paymentHistory.paymentHistory?.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" color="text.secondary">
                  No Payment History Available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Payment history will appear here once payments are recorded.
                </Typography>
              </Box>
            ) : (
              <Box>
                {/* Payment Summary */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`Total Payments: ${paymentHistory.summary?.totalPayments || 0}`} 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Outstanding: $${(paymentHistory.summary?.outstandingBalance || 0).toLocaleString()}`} 
                    color={paymentHistory.summary?.outstandingBalance > 0 ? "error" : "success"}
                    variant="outlined" 
                  />
                  <Chip 
                    label={`Avg Payment Days: ${paymentHistory.summary?.averagePaymentDays || 0}`} 
                    color="default" 
                    variant="outlined" 
                  />
                </Box>

                {/* Payment Table */}
                <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1, overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', bgcolor: '#f9fafb', p: 2, fontWeight: 'bold', fontSize: '0.875rem' }}>
                    <Box sx={{ flex: 1 }}>Date</Box>
                    <Box sx={{ flex: 1 }}>Amount</Box>
                    <Box sx={{ flex: 1 }}>Status</Box>
                    <Box sx={{ flex: 1 }}>Method</Box>
                    <Box sx={{ flex: 1 }}>Invoice</Box>
                  </Box>
                  {paymentHistory.paymentHistory.map((payment: any, index: number) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        p: 2, 
                        borderBottom: index < paymentHistory.paymentHistory.length - 1 ? '1px solid #e5e7eb' : 'none',
                        '&:hover': { bgcolor: '#f9fafb' }
                      }}
                    >
                      <Box sx={{ flex: 1, fontSize: '0.875rem' }}>
                        {new Date(payment.date).toLocaleDateString()}
                      </Box>
                      <Box sx={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>
                        ${payment.amount.toLocaleString()}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Chip
                          label={payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          size="small"
                          color={
                            payment.status === 'paid' ? 'success' :
                            payment.status === 'overdue' ? 'error' :
                            payment.status === 'pending' ? 'warning' :
                            'default'
                          }
                          variant="outlined"
                        />
                      </Box>
                      <Box sx={{ flex: 1, fontSize: '0.875rem' }}>
                        {payment.method || '-'}
                      </Box>
                      <Box sx={{ flex: 1, fontSize: '0.875rem' }}>
                        {payment.invoiceNumber || '-'}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Charts Row 3 - Customer Activity */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        {/* Customer Activity Chart */}
        <Paper sx={{ p: 3, boxShadow: 2, flex: '0 0 calc(50% - 12px)', minWidth: '400px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Support sx={{ fontSize: 20 }} />
              Customer Activity Over Time
            </Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="activity-select-label">Activity Type</InputLabel>
              <Select
                labelId="activity-select-label"
                id="activity-select"
                value={selectedActivity}
                label="Activity Type"
                onChange={(e) => setSelectedActivity(e.target.value)}
              >
                <MenuItem value="all">All Activities</MenuItem>
                {activityAnalytics?.activityTypes?.map((type: string) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ height: 250, width: '100%' }}>
            {!activityAnalytics || activityAnalytics.chartData?.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" color="text.secondary">
                  No Activity Data Available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Activity data will appear here once customer activities are recorded.
                </Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activityAnalytics.chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeWidth={0.5} />
                  <XAxis 
                    dataKey="period" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '14px',
                      zIndex: 9999
                    }}
                    formatter={(value, name) => [value, name as string]}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Legend />
                  {selectedActivity === 'all' ? (
                    // Show all activities
                    activityAnalytics.activityTypes?.map((type: string, index: number) => {
                      const colorKeys = Object.keys(COLORS.chart);
                      const colorKey = colorKeys[index % colorKeys.length];
                      const color = COLORS.chart[colorKey as keyof typeof COLORS.chart];
                      return (
                        <Line
                          key={type}
                          type="monotone"
                          dataKey={type}
                          stroke={color}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          name={type}
                        />
                      );
                    })
                  ) : (
                    // Show only selected activity
                    <Line
                      type="monotone"
                      dataKey={selectedActivity}
                      stroke={COLORS.primary}
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                      name={selectedActivity}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Insights Summary */}
      <Paper sx={{ p: 3, boxShadow: 1 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment sx={{ fontSize: 20 }} />
          Insights Summary
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`Total Insights: ${insightsAnalytics?.summary?.totalInsights || 0}`} 
            color="primary" 
            variant="outlined" 
          />
          <Chip 
            label={`Total Periods: ${insightsAnalytics?.summary?.totalPeriods || 0}`} 
            color="secondary" 
            variant="outlined" 
          />
          <Chip 
            label={`Avg per Period: ${insightsAnalytics?.summary?.averageInsightsPerPeriod || 0}`} 
            color="default" 
            variant="outlined" 
          />
          <Chip 
            label={`Latest Period: ${insightsAnalytics?.summary?.mostRecentPeriod || 'N/A'}`} 
            color="info" 
            variant="outlined" 
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default observer(CustomerDashboardPage);