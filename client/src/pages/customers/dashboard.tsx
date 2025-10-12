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
} from 'recharts';
import { observer } from 'mobx-react';
import customersStore from '@/stores/customers.store';
import { ICustomer } from '@/types';

const COLORS = {
  primary: '#3b82f6',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#0891b2',
  purple: '#7c3aed',
  pink: '#db2777',
  // Professional chart colors - muted earthy tones
  chart: {
    recurring: '#b0cc9f',      // Light green (like BMW bottom)
    ticketVolume: '#806650',   // Dark brown/green (like BMW middle)
    sentiment: '#e09966',      // Light orange/brown (like BMW top)
    escalating: '#cc6633',     // Dark orange/brown (like Ferrari bottom)
    resolution: '#b3b3b3',     // Light gray (like Ferrari middle)
    other: '#f0e6b3',          // Light yellow/cream (like Ferrari top)
  },
  // Status colors
  status: {
    active: '#dc2626',         // Red for active issues
    resolved: '#059669',       // Green for resolved
    in_progress: '#d97706',    // Orange for in progress
    pending: '#0891b2',        // Blue for pending
  }
};

const CustomerDashboardPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
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
      
      // Load dashboard data using the new route
      await customersStore.fetchDashboardData(customerId);
      const dashboardData = customersStore.dashboardData;
      
      if (dashboardData) {
        setCustomer(dashboardData.customer);
        setInsights(dashboardData.insights || []);
      } else {
        setError('Customer not found');
      }
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
  
  // Use chart data from the dashboard API response
  const insightsChartData = customersStore.dashboardData?.charts?.insightsByType || [];
  const insightsStatusChartData = customersStore.dashboardData?.charts?.insightsByStatus || [];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button
            onClick={() => navigate('/customers')}
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
            onClick={() => navigate(`/customers/${customer._id}`)}
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

      {/* Insights Analytics Chart */}
      <Paper sx={{ p: 3, mb: 3, boxShadow: 2 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lightbulb sx={{ fontSize: 20 }} />
          Customer Insights Generated Over Time
        </Typography>
        <Box sx={{ height: 400, width: '100%' }}>
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
                  fontSize: '14px'
                }}
                formatter={(value, name) => [value, getInsightTypeLabel(name as string)]}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '14px'
                }}
              />
              <Bar dataKey="recurring_problems" stackId="a" fill={COLORS.chart.recurring} name="Recurring Problems" />
              <Bar dataKey="high_ticket_volume" stackId="a" fill={COLORS.chart.ticketVolume} name="High Ticket Volume" />
              <Bar dataKey="sentiment_decline" stackId="a" fill={COLORS.chart.sentiment} name="Sentiment Decline" />
              <Bar dataKey="escalating_issues" stackId="a" fill={COLORS.chart.escalating} name="Escalating Issues" />
              <Bar dataKey="resolution_delays" stackId="a" fill={COLORS.chart.resolution} name="Resolution Delays" />
              <Bar dataKey="other" stackId="a" fill={COLORS.chart.other} name="Other Insights" />
            </BarChart>
          </ResponsiveContainer>
          )}
        </Box>
      </Paper>

      {/* Insights Status Chart */}
      <Paper sx={{ p: 3, mb: 3, boxShadow: 2 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment sx={{ fontSize: 20 }} />
          Insights by Status Over Time
        </Typography>
        <Box sx={{ height: 400, width: '100%' }}>
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
                  fontSize: '14px'
                }}
                formatter={(value, name) => {
                  const statusLabels: { [key: string]: string } = {
                    'active': 'Active',
                    'resolved': 'Resolved', 
                    'in_progress': 'In Progress',
                    'pending': 'Pending'
                  };
                  return [value, statusLabels[name as string] || name];
                }}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '14px'
                }}
              />
              <Bar dataKey="active" stackId="a" fill={COLORS.status.active} name="Active" />
              <Bar dataKey="resolved" stackId="a" fill={COLORS.status.resolved} name="Resolved" />
              <Bar dataKey="in_progress" stackId="a" fill={COLORS.status.in_progress} name="In Progress" />
              <Bar dataKey="pending" stackId="a" fill={COLORS.status.pending} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
          )}
        </Box>
      </Paper>

      {/* Insights Summary */}
      <Paper sx={{ p: 3, boxShadow: 1 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment sx={{ fontSize: 20 }} />
          Insights Summary
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`Total Insights: ${customersStore.dashboardData?.summary?.totalInsights || 0}`} 
            color="primary" 
            variant="outlined" 
          />
          <Chip 
            label={`Last 8 Weeks: ${customersStore.dashboardData?.summary?.insightsLast8Weeks || 0}`} 
            color="secondary" 
            variant="outlined" 
          />
          <Chip 
            label={`Most Common: ${getMostCommonInsightType()}`} 
            color="default" 
            variant="outlined" 
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default observer(CustomerDashboardPage);