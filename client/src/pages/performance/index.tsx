import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { 
  Refresh,
  AutorenewOutlined,
  TrendingUp,
  Psychology,
  VerifiedUser,
  AutoAwesome,
  Analytics,
  Assessment,
  Speed,
  Timeline
} from '@mui/icons-material';
import { Prediction, PredictionSummary, AccuracyAnalysis } from '@/types/prediction';
import { insightsService } from '@/services/insights-service';
import { useAuth } from '@/context/auth.context';
import { MetricCard, AccuracyChart, PerformanceSummary } from '@/components';
import ThresholdMissesSection from '@/components/performance/ThresholdMissesSection';

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
      id={`performance-tabpanel-${index}`}
      aria-labelledby={`performance-tab-${index}`}
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

const PerformancePage: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [predictionSummary, setPredictionSummary] = useState<PredictionSummary | null>(null);
  const [accuracyAnalysis, setAccuracyAnalysis] = useState<AccuracyAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const { organizationId } = useParams<{ organizationId: string }>();
  const { user } = useAuth();

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

    console.log('🔄 Fetching performance data for organization ID:', effectiveOrgId);

    fetchPerformanceData();
  }, [effectiveOrgId, user]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const [predictionsResponse, predictionSummaryResponse, accuracyResponse] = await Promise.all([
        insightsService.getPredictions(100),
        insightsService.getPredictionSummary().catch(() => ({ success: false, data: null })),
        insightsService.getPredictionAccuracy(30).catch(() => ({ success: false, data: null }))
      ]);
      
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
      console.error('Failed to fetch performance data:', error);
      setError('Failed to load performance data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchPerformanceData();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Prepare data for charts
  const confidenceAccuracyData = accuracyAnalysis ? [
    { name: 'High (≥80%)', accuracy: accuracyAnalysis.confidenceBreakdown.high.percentage, count: accuracyAnalysis.confidenceBreakdown.high.total, color: '#4caf50' },
    { name: 'Medium (50-79%)', accuracy: accuracyAnalysis.confidenceBreakdown.medium.percentage, count: accuracyAnalysis.confidenceBreakdown.medium.total, color: '#ff9800' },
    { name: 'Low (<50%)', accuracy: accuracyAnalysis.confidenceBreakdown.low.percentage, count: accuracyAnalysis.confidenceBreakdown.low.total, color: '#f44336' }
  ] : [];

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
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h3" gutterBottom sx={{ 
              fontWeight: 'bold', 
              color: '#1976d2',
              fontSize: { xs: '1.75rem', md: '2.125rem' }
            }}>
              🤖 AI Performance & System Reliability
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              Comprehensive analysis of prediction accuracy and system performance
            </Typography>
          </Box>
          <Tooltip title="Refresh performance data">
            <IconButton 
              onClick={refreshData} 
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
      </Box>

      {/* Quick Overview Cards */}
      {accuracyAnalysis && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ 
            fontWeight: 'bold', 
            color: '#1976d2', 
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Speed sx={{ fontSize: 28 }} />
            Performance Overview
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ 
                p: 3, 
                textAlign: 'center',
                height: '100%',
                boxShadow: 2,
                '&:hover': { boxShadow: 4 }
              }}>
                <Typography variant="h2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {accuracyAnalysis.overallAccuracy.toFixed(1)}%
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Overall Accuracy
                </Typography>
                <Tooltip title="Combined accuracy of all AI predictions">
                  <VerifiedUser sx={{ mt: 1, fontSize: 20, color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ 
                p: 3, 
                textAlign: 'center',
                height: '100%',
                boxShadow: 2,
                '&:hover': { boxShadow: 4 }
              }}>
                <Typography variant="h2" color="secondary" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {accuracyAnalysis.escalationAccuracy.percentage.toFixed(1)}%
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Escalation Accuracy
                </Typography>
                <Tooltip title="Accuracy of escalation risk predictions">
                  <TrendingUp sx={{ mt: 1, fontSize: 20, color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ 
                p: 3, 
                textAlign: 'center',
                height: '100%',
                boxShadow: 2,
                '&:hover': { boxShadow: 4 }
              }}>
                <Typography variant="h2" color="success.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {accuracyAnalysis.csatAccuracy.percentage.toFixed(1)}%
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                  CSAT Accuracy
                </Typography>
                <Tooltip title="Accuracy of customer satisfaction predictions">
                  <Psychology sx={{ mt: 1, fontSize: 20, color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ 
                p: 3, 
                textAlign: 'center',
                height: '100%',
                boxShadow: 2,
                '&:hover': { boxShadow: 4 }
              }}>
                <Typography variant="h2" color="warning.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {predictions.length}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Total Predictions
                </Typography>
                <Tooltip title="Total number of AI predictions made">
                  <AutoAwesome sx={{ mt: 1, fontSize: 20, color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Main Content Tabs */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="performance tabs"
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
              icon={<Analytics />} 
              label="AI Accuracy" 
              iconPosition="start"
              sx={{ minWidth: 140 }}
            />
            <Tab 
              icon={<Timeline />} 
              label="Resolution Time" 
              iconPosition="start"
              sx={{ minWidth: 140 }}
            />
            <Tab 
              icon={<Assessment />} 
              label="System Health" 
              iconPosition="start"
              sx={{ minWidth: 140 }}
            />
          </Tabs>
        </Box>

        {/* Tab 1: AI Accuracy */}
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
              <Analytics sx={{ fontSize: 28 }} />
              AI Prediction Accuracy Analysis
            </Typography>

            {accuracyAnalysis && accuracyAnalysis.totalChecked > 0 ? (
              <Box>
                {/* Performance Analysis */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
                  gap: 3,
                  mb: 4 
                }}>
                  <AccuracyChart 
                    data={confidenceAccuracyData}
                    title="Confidence vs. Accuracy Analysis"
                  />
                  <PerformanceSummary
                    overallAccuracy={accuracyAnalysis.overallAccuracy}
                    escalationAccuracy={accuracyAnalysis.escalationAccuracy.percentage}
                    csatAccuracy={accuracyAnalysis.csatAccuracy.percentage}
                    totalChecked={accuracyAnalysis.totalChecked}
                  />
                </Box>

                {/* Confidence Breakdown */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                    📊 Accuracy by Confidence Level
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Card sx={{ 
                        border: '2px solid #4caf50',
                        height: '100%',
                        boxShadow: 3
                      }}>
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
                            🔥 High Confidence (≥80%)
                          </Typography>
                          <Typography variant="h3" color="success.main" sx={{ fontWeight: 'bold', mb: 2 }}>
                            {accuracyAnalysis.confidenceBreakdown.high.percentage.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {accuracyAnalysis.confidenceBreakdown.high.correct} / {accuracyAnalysis.confidenceBreakdown.high.total} predictions correct
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Card sx={{ 
                        border: '2px solid #ff9800',
                        height: '100%',
                        boxShadow: 3
                      }}>
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main', mb: 1 }}>
                            ⚡ Medium Confidence (50-79%)
                          </Typography>
                          <Typography variant="h3" color="warning.main" sx={{ fontWeight: 'bold', mb: 2 }}>
                            {accuracyAnalysis.confidenceBreakdown.medium.percentage.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {accuracyAnalysis.confidenceBreakdown.medium.correct} / {accuracyAnalysis.confidenceBreakdown.medium.total} predictions correct
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Card sx={{ 
                        border: '2px solid #f44336',
                        height: '100%',
                        boxShadow: 3
                      }}>
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main', mb: 1 }}>
                            🤔 Low Confidence (&lt;50%)
                          </Typography>
                          <Typography variant="h3" color="error.main" sx={{ fontWeight: 'bold', mb: 2 }}>
                            {accuracyAnalysis.confidenceBreakdown.low.percentage.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {accuracyAnalysis.confidenceBreakdown.low.correct} / {accuracyAnalysis.confidenceBreakdown.low.total} predictions correct
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>

                {/* Key Insights */}
                <Paper sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
                    💡 Key Insights
                  </Typography>
                  <Grid container spacing={2}>
                    {accuracyAnalysis.confidenceBreakdown.high.total > 0 && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>High confidence predictions</strong> are correct {accuracyAnalysis.confidenceBreakdown.high.percentage.toFixed(1)}% of the time
                        </Typography>
                      </Grid>
                    )}
                    {accuracyAnalysis.escalationAccuracy.total > 0 && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Escalation risk</strong> successfully predicted in {accuracyAnalysis.escalationAccuracy.correct} out of {accuracyAnalysis.escalationAccuracy.total} closed tickets
                        </Typography>
                      </Grid>
                    )}
                    {accuracyAnalysis.csatAccuracy.total > 0 && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>CSAT risk</strong> correctly assessed in {accuracyAnalysis.csatAccuracy.correct} out of {accuracyAnalysis.csatAccuracy.total} closed tickets
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Box>
            ) : (
              <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: '#ffffff' }}>
                <Typography variant="h5" gutterBottom color="text.secondary" sx={{ fontWeight: 500 }}>
                  No Accuracy Data Available
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Accuracy analysis requires completed tickets with actual outcomes. 
                  Check back later as more tickets are completed and evaluated.
                </Typography>
              </Paper>
            )}
          </Box>
        </TabPanel>

        {/* Tab 2: Resolution Time */}
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
              <Timeline sx={{ fontSize: 28 }} />
              Resolution Time Prediction Accuracy
            </Typography>

            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 3,
              mb: 4 
            }}>
              <Paper sx={{ 
                p: 3, 
                backgroundColor: '#ffffff', 
                borderRadius: 2, 
                border: '1px solid #e0e0e0',
                textAlign: 'center',
                height: '100%',
                boxShadow: 2
              }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#ff9800', mb: 1 }}>
                  {predictionSummary?.longResolutionPredictions || 0}
                </Typography>
                <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
                  Long Resolution Predictions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tickets flagged as potentially taking longer to resolve
                </Typography>
              </Paper>
              
              <Paper sx={{ 
                p: 3, 
                backgroundColor: '#ffffff', 
                borderRadius: 2, 
                border: '1px solid #e0e0e0',
                textAlign: 'center',
                height: '100%',
                boxShadow: 2
              }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#4caf50', mb: 1 }}>
                  {accuracyAnalysis?.resolutionTimeAccuracy?.correct || 0}
                </Typography>
                <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
                  Accurate Predictions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Correctly predicted long resolution time
                </Typography>
              </Paper>
              
              <Paper sx={{ 
                p: 3, 
                backgroundColor: '#ffffff', 
                borderRadius: 2, 
                border: '1px solid #e0e0e0',
                textAlign: 'center',
                height: '100%',
                boxShadow: 2
              }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#f44336', mb: 1 }}>
                  {accuracyAnalysis?.resolutionTimeAccuracy ? 
                    (accuracyAnalysis.resolutionTimeAccuracy.total - accuracyAnalysis.resolutionTimeAccuracy.correct) : 0}
                </Typography>
                <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
                  False Positives
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Predicted long but resolved quickly
                </Typography>
              </Paper>
            </Box>
            
            {/* Detailed Resolution Time Analysis */}
            <Paper sx={{ p: 3, backgroundColor: '#ffffff', borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                📊 Resolution Time Distribution
              </Typography>
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Average Resolution Time (Predicted Long):
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {accuracyAnalysis?.avgPredictedLongResolutionTime ? 
                        `${accuracyAnalysis.avgPredictedLongResolutionTime} hours` : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Average Resolution Time (All Tickets):
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {accuracyAnalysis?.avgResolutionTime ? 
                        `${accuracyAnalysis.avgResolutionTime} hours` : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              {/* Resolution Time Prediction Accuracy */}
              {accuracyAnalysis?.resolutionTimeAccuracy && (
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Resolution Time Prediction Accuracy:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {accuracyAnalysis.resolutionTimeAccuracy.percentage.toFixed(1)}% 
                    ({accuracyAnalysis.resolutionTimeAccuracy.correct}/{accuracyAnalysis.resolutionTimeAccuracy.total})
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        </TabPanel>

        {/* Tab 3: System Health */}
        <TabPanel value={tabValue} index={2}>
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
              System Health & Reliability
            </Typography>

            {accuracyAnalysis && (
              <Box>
                {/* System Reliability Score */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 3,
                  mb: 4
                }}>
                  <Paper sx={{ 
                    p: 4, 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 2,
                    color: 'white',
                    textAlign: 'center',
                    boxShadow: 4
                  }}>
                    <Typography variant="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {Math.round(accuracyAnalysis.overallAccuracy)}
                    </Typography>
                    <Typography variant="h5" sx={{ opacity: 0.9 }}>
                      System Reliability Score
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2, opacity: 0.9 }}>
                      Based on {accuracyAnalysis.totalChecked} evaluated predictions
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ p: 3, backgroundColor: '#f5f5f5', borderRadius: 2, boxShadow: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      🎯 Key Insights
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • High confidence predictions (≥80%): {accuracyAnalysis.confidenceBreakdown.high.percentage.toFixed(1)}% accurate
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • Medium confidence predictions (50-79%): {accuracyAnalysis.confidenceBreakdown.medium.percentage.toFixed(1)}% accurate
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • Low confidence predictions (&lt;50%): {accuracyAnalysis.confidenceBreakdown.low.percentage.toFixed(1)}% accurate
                      </Typography>
                    </Box>
                  </Paper>
                </Box>

                {/* Threshold Misses Analysis */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                    🚨 Threshold Misses Analysis
                  </Typography>
                  <ThresholdMissesSection organizationId={effectiveOrgId} />
                </Box>
              </Box>
            )}
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default PerformancePage;
