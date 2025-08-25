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
import { insightsService } from '@/services/insights-service';
import { useAuth } from '@/context/auth.context';

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
  const [loading, setLoading] = useState<boolean>(true);
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
        const [insightsResponse, summaryResponse, predictionsResponse, predictionSummaryResponse, accuracyResponse] = await Promise.all([
          insightsService.getInsightsByOrganization(effectiveOrgId),
          insightsService.getInsightsSummary(effectiveOrgId),
          insightsService.getPredictions(20),
          insightsService.getPredictionSummary().catch(() => ({ success: false, data: null })),
          insightsService.getPredictionAccuracy(30).catch(() => ({ success: false, data: null }))
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
      } catch (error) {
        console.error('Failed to fetch insights:', error);
        setError('Failed to load insights. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [effectiveOrgId, user]);

  const refreshInsights = async () => {
    if (!effectiveOrgId) return;
    
    try {
      setLoading(true);
      const [insightsResponse, summaryResponse, predictionsResponse, predictionSummaryResponse, accuracyResponse] = await Promise.all([
        insightsService.getInsightsByOrganization(effectiveOrgId),
        insightsService.getInsightsSummary(effectiveOrgId),
        insightsService.getPredictions(20),
        insightsService.getPredictionSummary().catch(() => ({ success: false, data: null })),
        insightsService.getPredictionAccuracy(30).catch(() => ({ success: false, data: null }))
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
            value={tabValue} 
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
            <Tab 
              icon={<TrendingUpIcon />} 
              label="Issue Insights" 
              iconPosition="start"
              sx={{ minWidth: 140 }}
            />
            <Tab 
              icon={<Analytics />} 
              label="Predictions" 
              iconPosition="start"
              sx={{ minWidth: 140 }}
            />

          </Tabs>
        </Box>

        {/* Tab 1: Issue Insights */}
        <TabPanel value={tabValue} index={0}>
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
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 3,
                alignItems: 'stretch' // Ensure all cards stretch to same height
              }}>
                {insights.map((insight) => (
                  <Box key={insight.clusterId} sx={{ 
                    flex: '1 1 300px',
                    minWidth: { xs: '100%', md: '400px', lg: '350px' },
                    maxWidth: { lg: '400px' },
                    display: 'flex' // Make the box a flex container
                  }}>
                    <Card sx={{ 
                      width: '100%',
                      height: '100%',
                      minHeight: '400px', // Ensure consistent card height
                      boxShadow: 3,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        {/* Header */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 2,
                          minHeight: '80px' // Fixed height for consistent alignment
                        }}>
                          <BugReport color="primary" sx={{ mr: 1.5, fontSize: 24 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 'bold',
                              lineHeight: 1.3,
                              mb: 1
                            }}>
                              {insight.issueDescription}
                            </Typography>
                          </Box>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {/* Stats Row */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Timeline sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {insight.ticketVolume} tickets
                            </Typography>
                          </Box>
                          <Chip
                            label={`${insight.growthRate > 0 ? '+' : ''}${insight.growthRate.toFixed(1)}%`}
                            color={getTrendColor(insight.growthRate)}
                            size="medium"
                            icon={<Speed />}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Stack>

                        {/* Trend Indicator */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                          <Tooltip title={`Growth Rate: ${insight.growthRate.toFixed(1)}%`}>
                            <IconButton size="large" sx={{ color: getTrendColor(insight.growthRate) }}>
                              {getTrendIcon(insight.growthRate)}
                            </IconButton>
                          </Tooltip>
                        </Box>

                        {/* Dates */}
                        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            <strong>First Detected:</strong> {formatDate(insight.firstDetectedAt)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
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

        {/* Tab 2: Predictions */}
        <TabPanel value={tabValue} index={1}>
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
      </Box>
    </Box>
  );
};

export default InsightsPage;