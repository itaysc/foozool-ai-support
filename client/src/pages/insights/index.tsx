import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  CircularProgress,
  Alert,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Stack
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  TrendingFlat, 
  InfoOutlined,
  Timeline,
  BugReport,
  Speed,
  Refresh,
  AutorenewOutlined,
  ExpandMore,
  Dashboard,
  Analytics,
  Assessment,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { Insight, InsightSummary } from '@/types/insight';
import { Prediction, PredictionSummary, AccuracyAnalysis } from '@/types/prediction';
import { NPSInsights } from '@/types/nps';
import { insightsService } from '@/services/insights-service';
import { npsService } from '@/services/nps-service';
import { useAuth } from '@/context/auth.context';
import customersStore from '@/stores/customers.store';
import SelectBase from '@/components/base/Select';
import botsService from '@/services/bots-service';

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
      id={`insights-tabpanel-${index}`}
      aria-labelledby={`insights-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const InsightsPage: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [summary, setSummary] = useState<InsightSummary | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [predictionSummary, setPredictionSummary] = useState<PredictionSummary | null>(null);
  const [accuracyAnalysis, setAccuracyAnalysis] = useState<AccuracyAnalysis | null>(null);
  const [npsInsights, setNpsInsights] = useState<NPSInsights | null>(null);
  const [bots, setBots] = useState<Array<{ _id: string; type: 'customer_success' | 'issue_insights' | 'predictions' | 'nps' }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [csInsights, setCsInsights] = useState<any[] | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('__ALL__');
  const [allCsInsights, setAllCsInsights] = useState<Array<{ customerId: string; customerName?: string; insights: any[] }> | null>(null);
  const [topUsers, setTopUsers] = useState<Array<{ userId: string; name: string; email?: string; score: number; events: number }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const { organizationId } = useParams<{ organizationId: string }>();
  const { user } = useAuth();

  // Use organization ID from URL parameter, or from authenticated user
  const getOrganizationId = (org: any): string | null => {
    if (typeof org === 'string') return org;
    if (org && typeof org === 'object' && org._id) return org._id;
    return null;
  };
  
  const effectiveOrgId = organizationId || getOrganizationId(user?.organization);

  useEffect(() => {
    if (!effectiveOrgId) {
      setError('No organization ID available. Please ensure you are properly authenticated and have access to an organization.');
      setLoading(false);
      return;
    }

    // Additional validation to ensure the organization ID is valid
    if (effectiveOrgId === 'null' || effectiveOrgId === 'undefined' || effectiveOrgId === '') {
      setError('Invalid organization ID. Please contact your administrator.');
      setLoading(false);
      return;
    }

    console.log('🔄 Fetching insights for organization ID:', effectiveOrgId);

    const fetchInsights = async () => {
      try {
        setLoading(true);
        const [insightsResponse, summaryResponse, predictionsResponse, predictionSummaryResponse, accuracyResponse, npsResponse, botsResponse] = await Promise.all([
          insightsService.getInsightsByOrganization(effectiveOrgId),
          insightsService.getInsightsSummary(effectiveOrgId),
          insightsService.getPredictions(20),
          insightsService.getPredictionSummary().catch(() => ({ success: false, data: null })),
          insightsService.getPredictionAccuracy(30).catch(() => ({ success: false, data: null })),
          npsService.getNPSInsights().catch(() => null), // NPS is optional, don't fail if it's not available
          botsService.list().catch(() => [])
        ]);
        
        if (insightsResponse.success) {
          setInsights(insightsResponse.data);
        } else {
          setError('Failed to fetch insights');
        }

        if (summaryResponse.success) {
          setSummary(summaryResponse.data);
        }

        if (predictionsResponse.success) {
          setPredictions(predictionsResponse.data);
        }

        if (predictionSummaryResponse.success) {
          setPredictionSummary(predictionSummaryResponse.data);
        }

                    if (accuracyResponse.success) {
        setAccuracyAnalysis(accuracyResponse.data);
      }

      // Set NPS insights if available
      if (npsResponse) {
        setNpsInsights(npsResponse);
      }
      setBots(Array.isArray(botsResponse) ? botsResponse as any : []);
      } catch (error) {
        console.error('Failed to fetch insights:', error);
        setError('Failed to load insights. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [effectiveOrgId, user]);

  // Ensure customers are loaded for the CS tab selector
  useEffect(() => {
    if (customersStore.customers.length === 0) {
      customersStore.fetchCustomers();
    }
  }, []);

  const fetchCustomerSuccessInsights = async (customerId: string) => {
    if (!customerId) return;
    try {
      const res = await insightsService.getCustomerSuccessInsights(customerId);
      if (res.success) setCsInsights(res.data);
    } catch (e) {
      setCsInsights([]);
    }
  };

  const fetchAllCustomerSuccessInsights = async () => {
    try {
      const res = await insightsService.getAllCustomerSuccessInsights();
      if (res.success) setAllCsInsights(res.data);
      // Fetch top users alongside
      const top = await insightsService.getTopActiveUsers(10, 30);
      if (top.success) setTopUsers(top.data);
    } catch (e) {
      setAllCsInsights([]);
    }
  };

  // Load default view for CS insights (All customers)
  useEffect(() => {
    if (selectedCustomerId === '__ALL__') {
      fetchAllCustomerSuccessInsights();
    }
  }, [selectedCustomerId]);

  const refreshInsights = async () => {
    if (!effectiveOrgId) return;
    
    try {
      setLoading(true);
      const [insightsResponse, summaryResponse, predictionsResponse, predictionSummaryResponse, accuracyResponse, npsResponse] = await Promise.all([
        insightsService.getInsightsByOrganization(effectiveOrgId),
        insightsService.getInsightsSummary(effectiveOrgId),
        insightsService.getPredictions(20),
        insightsService.getPredictionSummary().catch(() => ({ success: false, data: null })),
        insightsService.getPredictionAccuracy(30).catch(() => ({ success: false, data: null })),
        npsService.getNPSInsights().catch(() => null)
      ]);
      
      if (insightsResponse.success) {
        setInsights(insightsResponse.data);
      }

      if (summaryResponse.success) {
        setSummary(summaryResponse.data);
      }

      if (predictionsResponse.success) {
        setPredictions(predictionsResponse.data);
      }

      if (predictionSummaryResponse.success) {
        setPredictionSummary(predictionSummaryResponse.data);
      }

      if (accuracyResponse.success) {
        setAccuracyAnalysis(accuracyResponse.data);
      }
    } catch (error) {
      console.error('Failed to refresh insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (growthRate: number) => {
    if (growthRate > 5) return <TrendingUp color="error" />;
    if (growthRate < -5) return <TrendingDown color="success" />;
    return <TrendingFlat color="action" />;
  };

  const getTrendColor = (growthRate: number) => {
    if (growthRate > 5) return 'error';
    if (growthRate < -5) return 'success';
    return 'default';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskColor = (risk: 'Low' | 'Medium' | 'High') => {
    switch (risk) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getRiskIcon = (risk: 'Low' | 'Medium' | 'High') => {
    switch (risk) {
      case 'High': return '🔴';
      case 'Medium': return '🟡';
      case 'Low': return '🟢';
      default: return '⚪';
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Determine visible tabs based on data or configured bots
  const visibleTabKeys: Array<'issue' | 'pred' | 'nps' | 'cs'> = [];
  if (bots.some(b => b.type === 'issue_insights') || insights.length > 0) visibleTabKeys.push('issue');
  if (bots.some(b => b.type === 'predictions') || predictions.length > 0) visibleTabKeys.push('pred');
  if (bots.some(b => b.type === 'nps') || !!npsInsights) visibleTabKeys.push('nps');
  if (bots.some(b => b.type === 'customer_success') || (csInsights && csInsights.length > 0)) visibleTabKeys.push('cs');

  // Clamp selected tab index to visible range
  const safeTabValue = Math.min(tabValue, Math.max(visibleTabKeys.length - 1, 0));

  return (
    <Box sx={{ 
      p: 3, 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      '& @keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
      }
    }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h3" gutterBottom sx={{ 
              fontWeight: 'bold', 
              color: '#1976d2',
              fontSize: { xs: '1.75rem', md: '2.125rem' }
            }}>
              Insights 🤖
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              Real-time analysis of support ticket patterns and emerging issues
            </Typography>
          </Box>
          <Tooltip title="Refresh insights data">
            <IconButton 
              onClick={refreshInsights} 
              disabled={loading}
              sx={{ 
                backgroundColor: '#ffffff',
                boxShadow: 2,
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
            >
              {loading ? <AutorenewOutlined sx={{ animation: 'spin 1s linear infinite' }} /> : <Refresh />}
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Organization Info */}
        {!organizationId && user?.organization && (
          <Paper sx={{ 
            p: 2, 
            backgroundColor: '#e8f5e8', 
            borderRadius: 2,
            border: '1px solid #4caf50',
            boxShadow: 1
          }}>
            <Typography variant="body1" color="success.dark" sx={{ fontWeight: 500 }}>
              🏢 Viewing insights for your organization: {typeof user.organization === 'object' ? user.organization.name : user.organization}
            </Typography>
          </Paper>
        )}
        {!organizationId && !user?.organization && (
          <Paper sx={{ 
            p: 2, 
            backgroundColor: '#fff3e0', 
            borderRadius: 2,
            border: '1px solid #ff9800',
            boxShadow: 1
          }}>
            <Typography variant="body1" color="warning.dark" sx={{ fontWeight: 500 }}>
              ⚠️ No organization access available. Please ensure you are properly authenticated and have access to an organization.
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Quick Overview Cards */}
      {summary && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ 
            fontWeight: 'bold', 
            color: '#1976d2', 
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Dashboard sx={{ fontSize: 28 }} />
            Quick Overview
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 3 
          }}>
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center',
              height: '100%',
              boxShadow: 2,
              '&:hover': { boxShadow: 4 }
            }}>
              <Typography variant="h2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                {summary.totalInsights}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Active Insights
              </Typography>
              <Tooltip title="Number of unique issue patterns identified by AI">
                <InfoOutlined sx={{ mt: 1, fontSize: 20, color: 'text.secondary', cursor: 'help' }} />
              </Tooltip>
            </Paper>
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center',
              height: '100%',
              boxShadow: 2,
              '&:hover': { boxShadow: 4 }
            }}>
              <Typography variant="h2" color="secondary" sx={{ fontWeight: 'bold', mb: 1 }}>
                {summary.totalTicketVolume}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Total Tickets
              </Typography>
              <Tooltip title="Total tickets analyzed for insights">
                <InfoOutlined sx={{ mt: 1, fontSize: 20, color: 'text.secondary', cursor: 'help' }} />
              </Tooltip>
            </Paper>
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center',
              height: '100%',
              boxShadow: 2,
              '&:hover': { boxShadow: 4 }
            }}>
              <Typography variant="h2" color="success.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                {summary.avgGrowthRate.toFixed(1)}%
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Avg Growth Rate
              </Typography>
              <Tooltip title="Average change in ticket volume across insights">
                <InfoOutlined sx={{ mt: 1, fontSize: 20, color: 'text.secondary', cursor: 'help' }} />
              </Tooltip>
            </Paper>
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center',
              height: '100%',
              boxShadow: 2,
              '&:hover': { boxShadow: 4 }
            }}>
              <Typography variant="h2" color="error.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                {summary.maxGrowthRate.toFixed(1)}%
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Max Growth Rate
              </Typography>
              <Tooltip title="Highest growth rate among all insights">
                <InfoOutlined sx={{ mt: 1, fontSize: 20, color: 'text.secondary', cursor: 'help' }} />
              </Tooltip>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Main Content Tabs */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={safeTabValue} 
            onChange={handleTabChange} 
            aria-label="insights tabs"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '1rem',
                fontWeight: 500,
                textTransform: 'none'
              }
            }}
          >
            {(visibleTabKeys.includes('issue')) && (
              <Tab icon={<TrendingUpIcon />} label="Issue Insights" iconPosition="start" sx={{ minWidth: 140 }} />
            )}
            {(visibleTabKeys.includes('pred')) && (
              <Tab icon={<Analytics />} label="Predictions" iconPosition="start" sx={{ minWidth: 140 }} />
            )}
            {(visibleTabKeys.includes('nps')) && (
              <Tab icon={<Assessment />} label="NPS Insights" iconPosition="start" sx={{ minWidth: 140 }} />
            )}
            {(visibleTabKeys.includes('cs')) && (
              <Tab icon={<Dashboard />} label="Customer Success" iconPosition="start" sx={{ minWidth: 180 }} />
            )}

          </Tabs>
        </Box>

        {/* Tab 1: Issue Insights */}
        {visibleTabKeys.includes('issue') && (
        <TabPanel value={safeTabValue} index={visibleTabKeys.indexOf('issue')}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ 
              fontWeight: 'bold', 
              color: '#1976d2', 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <BugReport sx={{ fontSize: 28 }} />
              Issue Pattern Analysis
            </Typography>
            
            {insights.length > 0 ? (
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(auto-fill, minmax(300px, 300px))',
                  md: 'repeat(auto-fill, minmax(320px, 320px))'
                },
                justifyContent: 'flex-start',
                gap: 2
              }}>
                {insights.map((insight) => (
                  <Box key={insight.clusterId} sx={{ width: { xs: '300px', md: '320px' } }}>
                    <Card sx={{ width: '100%', height: '100%', boxShadow: 1, borderRadius: 1 }}>
                      <CardContent sx={{ p: 2 }}>
                        {/* Stats Row (moved above divider) */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Timeline sx={{ mr: 0.75, fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {insight.ticketVolume} tickets
                            </Typography>
                          </Box>
                          <Chip
                            variant="outlined"
                            label={`${insight.growthRate > 0 ? '+' : ''}${insight.growthRate.toFixed(1)}%`}
                            color={getTrendColor(insight.growthRate)}
                            size="small"
                            icon={<Speed sx={{ fontSize: 16 }} />}
                            sx={{ '& .MuiChip-label': { fontSize: '0.75rem', fontWeight: 700 } }}
                          />
                        </Stack>

                        <Divider sx={{ mb: 1 }} />

                        {/* Header (moved below divider) */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <BugReport color="primary" sx={{ mr: 1, fontSize: 18 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                              {insight.issueDescription || 'No description available'}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Dates (smaller typography) */}
                        <Box sx={{ mt: 0.5, p: 1, backgroundColor: '#f6f8fb', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25, fontSize: '0.72rem' }}>
                            <strong>First Detected:</strong> {formatDate(insight.firstDetectedAt)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.72rem' }}>
                            <strong>Last Updated:</strong> {formatDate(insight.lastUpdatedAt)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            ) : (
              <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: '#ffffff' }}>
                <InfoOutlined sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
                <Typography variant="h5" gutterBottom color="text.secondary" sx={{ fontWeight: 500 }}>
                  No New Insights
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  No new insights have been detected for this organization yet. 
                  Check back later as our AI analyzes more support tickets.
                </Typography>
              </Paper>
            )}
          </Box>
        </TabPanel>
        )}

        {/* Tab 2: Predictions */}
        {visibleTabKeys.includes('pred') && (
        <TabPanel value={safeTabValue} index={visibleTabKeys.indexOf('pred')}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ 
              fontWeight: 'bold', 
              color: '#1976d2', 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Analytics sx={{ fontSize: 28 }} />
              Risk Predictions
            </Typography>

            {/* Prediction Summary */}
            {predictionSummary && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                  📊 Prediction Overview
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 3 
                }}>
                  <Box sx={{ 
                    flex: '1 1 200px',
                    minWidth: { xs: '100%', sm: '200px' }
                  }}>
                    <Paper sx={{ p: 2.5, textAlign: 'center', height: '100%', boxShadow: 2 }}>
                      <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {predictionSummary.totalPredictions}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Total Predictions
                      </Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ 
                    flex: '1 1 200px',
                    minWidth: { xs: '100%', sm: '200px' }
                  }}>
                    <Paper sx={{ p: 2.5, textAlign: 'center', height: '100%', boxShadow: 2 }}>
                      <Typography variant="h3" color="error.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {predictionSummary.highEscalationRisk}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        High Escalation Risk
                      </Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ 
                    flex: '1 1 200px',
                    minWidth: { xs: '100%', sm: '200px' }
                  }}>
                    <Paper sx={{ p: 2.5, textAlign: 'center', height: '100%', boxShadow: 2 }}>
                      <Typography variant="h3" color="warning.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {predictionSummary.highCSATRisk}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        High CSAT Risk
                      </Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ 
                    flex: '1 1 200px',
                    minWidth: { xs: '100%', sm: '200px' }
                  }}>
                    <Paper sx={{ p: 2.5, textAlign: 'center', height: '100%', boxShadow: 2 }}>
                      <Typography variant="h3" color="success.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {Math.round(predictionSummary.avgEscalationConfidence * 100)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Avg Confidence
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Recent Predictions */}
            {predictions.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                  🔮 Recent Risk Predictions
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 2 
                }}>
                  {predictions.slice(0, 6).map((prediction) => (
                    <Box key={prediction.ticketId} sx={{ 
                      flex: '1 1 300px',
                      minWidth: { xs: '100%', md: '400px' }
                    }}>
                      <Card sx={{ 
                        border: `2px solid ${getRiskColor(prediction.predictedEscalation.risk) === 'error' || getRiskColor(prediction.predictedCSAT.risk) === 'error' ? '#f44336' : '#e0e0e0'}`,
                        '&:hover': { boxShadow: 4 }
                      }}>
                        <CardContent sx={{ p: 2.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              Ticket #{prediction.ticketId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(prediction.createdAt)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 2 
                          }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Escalation Risk
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip 
                                  label={`${getRiskIcon(prediction.predictedEscalation.risk)} ${prediction.predictedEscalation.risk}`}
                                  color={getRiskColor(prediction.predictedEscalation.risk) as any}
                                  size="small"
                                />
                                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                  {Math.round(prediction.predictedEscalation.confidence * 100)}%
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                CSAT Risk
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip 
                                  label={`${getRiskIcon(prediction.predictedCSAT.risk)} ${prediction.predictedCSAT.risk}`}
                                  color={getRiskColor(prediction.predictedCSAT.risk) as any}
                                  size="small"
                                />
                                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                  {Math.round(prediction.predictedCSAT.confidence * 100)}%
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </TabPanel>
        )}

        {/* Tab 3: NPS Insights */}
        {visibleTabKeys.includes('nps') && (
        <TabPanel value={safeTabValue} index={visibleTabKeys.indexOf('nps')}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ 
              fontWeight: 'bold', 
              color: '#1976d2', 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Assessment sx={{ fontSize: 28 }} />
              NPS Customer Insights
            </Typography>

            {npsInsights ? (
              <Box>
                {/* NPS Score Overview */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                    📊 NPS Overview
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 3 
                  }}>
                    <Box sx={{ 
                      flex: '1 1 200px',
                      minWidth: { xs: '100%', sm: '200px' }
                    }}>
                      <Paper sx={{ p: 2.5, textAlign: 'center', height: '100%', boxShadow: 2 }}>
                        <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {npsInsights.currentNPS}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Current NPS Score
                        </Typography>
                      </Paper>
                    </Box>
                    <Box sx={{ 
                      flex: '1 1 200px',
                      minWidth: { xs: '100%', sm: '200px' }
                    }}>
                      <Paper sx={{ p: 2.5, textAlign: 'center', height: '100%', boxShadow: 2 }}>
                        <Typography variant="h3" color={npsInsights.npsChange >= 0 ? 'success.main' : 'error.main'} sx={{ fontWeight: 'bold', mb: 1 }}>
                          {npsInsights.npsChange >= 0 ? '+' : ''}{npsInsights.npsChange}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          NPS Change
                        </Typography>
                      </Paper>
                    </Box>
                    <Box sx={{ 
                      flex: '1 1 200px',
                      minWidth: { xs: '100%', sm: '200px' }
                    }}>
                      <Paper sx={{ p: 2.5, textAlign: 'center', height: '100%', boxShadow: 2 }}>
                        <Typography variant="h3" color="info.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {npsInsights.totalResponses}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Total Responses
                        </Typography>
                      </Paper>
                    </Box>
                  </Box>
                </Box>

                {/* Segment Breakdown */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                    🎯 Customer Segments
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 2 
                  }}>
                    <Paper sx={{ p: 2, flex: '1 1 150px', textAlign: 'center', boxShadow: 2 }}>
                      <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {npsInsights.segmentBreakdown.promoters}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Promoters (9-10)
                      </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, flex: '1 1 150px', textAlign: 'center', boxShadow: 2 }}>
                      <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {npsInsights.segmentBreakdown.passives}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Passives (7-8)
                      </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, flex: '1 1 150px', textAlign: 'center', boxShadow: 2 }}>
                      <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {npsInsights.segmentBreakdown.detractors}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Detractors (0-6)
                      </Typography>
                    </Paper>
                  </Box>
                </Box>

                {/* Response Clustering */}
                {npsInsights.responseClustering && npsInsights.responseClustering.clusters.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                      🔍 Response Clustering Analysis
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Clustering Quality: <strong>{npsInsights.responseClustering.clusteringQuality}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {npsInsights.responseClustering.totalClusters} clusters found from {npsInsights.responseClustering.totalClusteredResponses} responses
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 3 
                    }}>
                      {npsInsights.responseClustering.clusters.map((cluster) => (
                        <Box key={cluster.id} sx={{ 
                          flex: '1 1 400px',
                          minWidth: { xs: '100%', md: '400px' }
                        }}>
                          <Card sx={{ 
                            width: '100%',
                            boxShadow: 3,
                            border: `2px solid ${
                              cluster.priority === 'high' ? '#f44336' : 
                              cluster.priority === 'medium' ? '#ff9800' : '#4caf50'
                            }`
                          }}>
                            <CardContent sx={{ p: 3 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                                  {cluster.questionText}
                                </Typography>
                                <Chip 
                                  label={`${cluster.count} responses`}
                                  color={cluster.priority === 'high' ? 'error' : cluster.priority === 'medium' ? 'warning' : 'success'}
                                  size="small"
                                  sx={{ fontWeight: 'bold' }}
                                />
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                                "{cluster.representativeResponse}"
                              </Typography>

                              <Box sx={{ mt: 2 }}>
                                {cluster.insights.map((insight, index) => (
                                  <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                                    {insight}
                                  </Typography>
                                ))}
                              </Box>
                            </CardContent>
                          </Card>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* General Insights */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                    💡 Key Insights
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 2 
                  }}>
                    {npsInsights.insights.map((insight, index) => (
                      <Paper key={index} sx={{ p: 2, flex: '1 1 300px', boxShadow: 2 }}>
                        <Typography variant="body1">
                          {insight}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>

                {/* Recommendations */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                    🎯 Recommendations
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 2 
                  }}>
                    {npsInsights.recommendations.map((recommendation, index) => (
                      <Paper key={index} sx={{ p: 2, flex: '1 1 300px', boxShadow: 2 }}>
                        <Typography variant="body1">
                          {recommendation}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              </Box>
            ) : (
              <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: '#ffffff' }}>
                <Assessment sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
                <Typography variant="h5" gutterBottom color="text.secondary" sx={{ fontWeight: 500 }}>
                  No NPS Data Available
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  No NPS insights have been generated for this organization yet. 
                  Upload NPS data to start generating customer insights and response clustering analysis.
                </Typography>
              </Paper>
            )}
          </Box>
        </TabPanel>
        )}
        {/* Tab 4: Customer Success Insights */}
        {visibleTabKeys.includes('cs') && (
        <TabPanel value={safeTabValue} index={visibleTabKeys.indexOf('cs')}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ 
              fontWeight: 'bold', 
              color: '#1976d2', 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Dashboard sx={{ fontSize: 28 }} />
              Customer Success Insights
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, maxWidth: 560 }}>
              <SelectBase
                value={selectedCustomerId}
                onChange={(v) => {
                  const val = (v ?? '') as string;
                  setSelectedCustomerId(val);
                  if (val === '__ALL__') {
                    fetchAllCustomerSuccessInsights();
                    setCsInsights(null);
                  } else if (val) {
                    fetchCustomerSuccessInsights(val);
                    setAllCsInsights(null);
                  } else {
                    setCsInsights(null);
                    setAllCsInsights(null);
                  }
                }}
                size="small"
                fullWidth
                label="Customer Scope"
                placeholder="All customers or select one"
                searchable
                allowClear
                options={[{ value: '__ALL__', label: 'All customers' }, ...customersStore.customers.map(c => ({ value: c._id, label: c.name }))]}
              />
            </Box>

            {(csInsights && csInsights.length > 0) ? (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(auto-fill, minmax(300px, 300px))',
                  md: 'repeat(auto-fill, minmax(320px, 320px))'
                },
                justifyContent: 'flex-start',
                gap: 2
              }}>
                {csInsights.map((insight, idx) => (
                  <Box key={idx} sx={{ width: { xs: '300px', md: '320px' } }}>
                    <Card sx={{ width: '100%', height: '100%', boxShadow: 1, borderRadius: 1 }}>
                      <CardContent sx={{ p: 1 }}>
                        {/* Customer name header */}
                        {insight.meta?.customerName && (
                          <>
                            <Typography variant="overline" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: 0.4, fontSize: '0.7rem' }}>
                              {insight.meta.customerName}
                            </Typography>
                            <Divider sx={{ mb: 0.5 }} />
                          </>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <Chip 
                            label={insight.type.replace(/_/g, ' ')} 
                            color={insight.severity === 'red' ? 'error' : insight.severity === 'yellow' ? 'warning' : 'default'}
                            size="small"
                            sx={{ textTransform: 'capitalize', fontWeight: 'bold', '& .MuiChip-label': { fontSize: '0.7rem' } }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.3, fontSize: '0.78rem' }}>
                          {insight.message}
                        </Typography>
                        {insight.meta && (
                          <Box sx={{ mt: 0.5, p: 0.5, borderRadius: 1, backgroundColor: '#f5f7fb' }}>
                            {Object.entries(insight.meta)
                              .filter(([k]) => k !== 'customerName' && k !== 'featureId' && k !== '_id')
                              .map(([k, v]) => (
                                <Typography key={k} variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.72rem' }}>
                                  <strong>{k}:</strong> {String(v)}
                                </Typography>
                              ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            ) : (allCsInsights && allCsInsights.length > 0) ? (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(auto-fill, minmax(300px, 300px))',
                  md: 'repeat(auto-fill, minmax(320px, 320px))'
                },
                justifyContent: 'flex-start',
                gap: 2
              }}>
                {allCsInsights.flatMap(group => group.insights.map((insight, idx) => (
                  <Box key={`${group.customerId}-${idx}`} sx={{ width: { xs: '300px', md: '320px' } }}>
                    <Card sx={{ width: '100%', height: '100%', boxShadow: 1, borderRadius: 1 }}>
                      <CardContent sx={{ p: 1 }}>
                        {/* Customer name header */}
                        <Typography variant="overline" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: 0.4, fontSize: '0.7rem' }}>
                          {insight.meta?.customerName || group.customerName}
                        </Typography>
                        <Divider sx={{ mb: 0.5 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <Chip 
                            label={insight.type.replace(/_/g, ' ')} 
                            color={insight.severity === 'red' ? 'error' : insight.severity === 'yellow' ? 'warning' : 'default'}
                            size="small"
                            sx={{ textTransform: 'capitalize', fontWeight: 'bold', '& .MuiChip-label': { fontSize: '0.7rem' } }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.3, fontSize: '0.78rem' }}>
                          {insight.message}
                        </Typography>
                        {insight.meta && (
                          <Box sx={{ mt: 0.5, p: 0.5, borderRadius: 1, backgroundColor: '#f5f7fb' }}>
                            {Object.entries(insight.meta)
                              .filter(([k]) => k !== 'customerName' && k !== 'featureId' && k !== '_id')
                              .map(([k, v]) => (
                                <Typography key={k} variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.72rem' }}>
                                  <strong>{k}:</strong> {String(v)}
                                </Typography>
                              ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                )))}
              </Box>
            ) : (
              <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: '#ffffff' }}>
                <InfoOutlined sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
                <Typography variant="h5" gutterBottom color="text.secondary" sx={{ fontWeight: 500 }}>
                  No Customer Success Insights Yet
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Once you select a customer and generate usage, risk insights will appear here.
                </Typography>
              </Paper>
            )}

            {/* Top Active Users metric */}
            {topUsers && topUsers.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Top Active Users (30 days)
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
                    {topUsers.slice(0, 10).map((u, idx) => (
                      <Box key={u.userId} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', py: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {idx + 1}. {u.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          score {u.score} · {u.events} events
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>
        </TabPanel>
        )}
      </Box>
    </Box>
  );
};

export default InsightsPage;