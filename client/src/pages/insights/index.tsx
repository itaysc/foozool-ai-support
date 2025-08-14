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
  Tooltip
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
  AutorenewOutlined
} from '@mui/icons-material';
import { Insight, InsightSummary } from '@/types/insight';
import { Prediction, PredictionSummary, AccuracyAnalysis } from '@/types/prediction';
import { insightsService } from '@/services/insights-service';
import { useAuth } from '@/context/auth.context';

const InsightsPage: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [summary, setSummary] = useState<InsightSummary | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [predictionSummary, setPredictionSummary] = useState<PredictionSummary | null>(null);
  const [accuracyAnalysis, setAccuracyAnalysis] = useState<AccuracyAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { organizationId } = useParams<{ organizationId: string }>();
  const { user } = useAuth();

  // Use organization ID from URL parameter, or from authenticated user, or fallback to demo
  const effectiveOrgId = organizationId || (user?.organization as string) || 'demo-org-id';

  useEffect(() => {
    if (!effectiveOrgId) {
      setError('Organization ID is required');
      setLoading(false);
      return;
    }

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
      backgroundColor: '#f5f5f5',
      '& @keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
      }
    }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              AI-Powered Support Insights 🤖
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Real-time analysis of support ticket patterns and emerging issues
            </Typography>
          </Box>
          <Tooltip title="Refresh insights data">
            <IconButton 
              onClick={refreshInsights} 
              disabled={loading}
              sx={{ 
                backgroundColor: '#f5f5f5',
                '&:hover': { backgroundColor: '#e0e0e0' }
              }}
            >
              {loading ? <AutorenewOutlined sx={{ animation: 'spin 1s linear infinite' }} /> : <Refresh />}
            </IconButton>
          </Tooltip>
        </Box>
        {!organizationId && user?.organization && (
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            backgroundColor: '#e8f5e8', 
            borderRadius: 2,
            border: '1px solid #4caf50'
          }}>
            <Typography variant="body2" color="success.dark" sx={{ fontWeight: 'medium' }}>
              🏢 Viewing insights for your organization (ID: {user.organization})
            </Typography>
          </Box>
        )}
        {!organizationId && !user?.organization && (
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            backgroundColor: '#e3f2fd', 
            borderRadius: 2,
            border: '1px solid #2196f3'
          }}>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 'medium' }}>
              📊 Viewing demo insights data. Connect an organization to see real insights.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Summary Stats */}
      {summary && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 4 
        }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
              {summary.totalInsights}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Insights
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" color="secondary" sx={{ fontWeight: 'bold' }}>
              {summary.totalTicketVolume}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Tickets
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main" sx={{ fontWeight: 'bold' }}>
              {summary.avgGrowthRate.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Growth Rate
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" color="error.main" sx={{ fontWeight: 'bold' }}>
              {summary.maxGrowthRate.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Max Growth Rate
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Prediction Summary Stats */}
      {predictionSummary && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
            🔮 Real-Time Risk Predictions
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
            gap: 3,
            mb: 3 
          }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                {predictionSummary.totalPredictions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Predictions
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="error.main" sx={{ fontWeight: 'bold' }}>
                {predictionSummary.highEscalationRisk}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Escalation Risk
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {predictionSummary.highCSATRisk}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High CSAT Risk
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="success.main" sx={{ fontWeight: 'bold' }}>
                {Math.round(predictionSummary.avgEscalationConfidence * 100)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Confidence
              </Typography>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Prediction Accuracy Analysis */}
      {accuracyAnalysis && accuracyAnalysis.totalChecked > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
            🎯 AI Prediction Accuracy
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
            gap: 3,
            mb: 3 
          }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                {accuracyAnalysis.totalChecked}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tickets Evaluated
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="success.main" sx={{ fontWeight: 'bold' }}>
                {accuracyAnalysis.overallAccuracy.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overall Accuracy
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="info.main" sx={{ fontWeight: 'bold' }}>
                {accuracyAnalysis.escalationAccuracy.percentage.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Escalation Accuracy
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h3" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {accuracyAnalysis.csatAccuracy.percentage.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                CSAT Accuracy
              </Typography>
            </Paper>
          </Box>

          {/* Confidence Breakdown */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              📊 Accuracy by Confidence Level
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
              gap: 2 
            }}>
              <Card sx={{ border: '2px solid #4caf50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      🔥 High Confidence (≥80%)
                    </Typography>
                  </Box>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {accuracyAnalysis.confidenceBreakdown.high.percentage.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {accuracyAnalysis.confidenceBreakdown.high.correct} / {accuracyAnalysis.confidenceBreakdown.high.total} predictions correct
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ border: '2px solid #ff9800' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                      ⚡ Medium Confidence (50-79%)
                    </Typography>
                  </Box>
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    {accuracyAnalysis.confidenceBreakdown.medium.percentage.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {accuracyAnalysis.confidenceBreakdown.medium.correct} / {accuracyAnalysis.confidenceBreakdown.medium.total} predictions correct
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ border: '2px solid #f44336' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      🤔 Low Confidence (&lt;50%)
                    </Typography>
                  </Box>
                  <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                    {accuracyAnalysis.confidenceBreakdown.low.percentage.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {accuracyAnalysis.confidenceBreakdown.low.correct} / {accuracyAnalysis.confidenceBreakdown.low.total} predictions correct
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Insights about accuracy */}
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
            <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
              💡 Key Insights:
            </Typography>
            <Box component="ul" sx={{ ml: 2, mb: 0 }}>
              {accuracyAnalysis.confidenceBreakdown.high.total > 0 && (
                <Typography component="li" variant="body2" color="text.secondary">
                  High confidence predictions are correct {accuracyAnalysis.confidenceBreakdown.high.percentage.toFixed(1)}% of the time
                </Typography>
              )}
              {accuracyAnalysis.escalationAccuracy.total > 0 && (
                <Typography component="li" variant="body2" color="text.secondary">
                  Successfully predicted escalation risk in {accuracyAnalysis.escalationAccuracy.correct} out of {accuracyAnalysis.escalationAccuracy.total} closed tickets
                </Typography>
              )}
              {accuracyAnalysis.csatAccuracy.total > 0 && (
                <Typography component="li" variant="body2" color="text.secondary">
                  Correctly assessed CSAT risk in {accuracyAnalysis.csatAccuracy.correct} out of {accuracyAnalysis.csatAccuracy.total} closed tickets
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {/* Recent Predictions */}
      {predictions.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            📊 Recent Risk Predictions
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2 
          }}>
            {predictions.slice(0, 6).map((prediction, index) => (
              <Card key={prediction.ticketId} sx={{ 
                border: `2px solid ${getRiskColor(prediction.predictedEscalation.risk) === 'error' || getRiskColor(prediction.predictedCSAT.risk) === 'error' ? '#f44336' : '#e0e0e0'}`,
                '&:hover': { boxShadow: 6 }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Ticket #{prediction.ticketId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(prediction.createdAt)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
                        <Typography variant="caption">
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
                        <Typography variant="caption">
                          {Math.round(prediction.predictedCSAT.confidence * 100)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Insights Cards */}
      {insights.length > 0 ? (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' },
          gap: 3 
        }}>
          {insights.map((insight) => (
            <Box key={insight.clusterId}>
              <Card 
                sx={{ 
                  height: '100%',
                  boxShadow: 3,
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent>
                  {/* Header with trend indicator */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <BugReport color="primary" sx={{ mr: 1, mt: 0.5 }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold',
                        lineHeight: 1.3,
                        mb: 1
                      }}>
                        {insight.issueDescription}
                      </Typography>
                    </Box>
                    <Tooltip title={`Growth Rate: ${insight.growthRate.toFixed(1)}%`}>
                      <IconButton size="small">
                        {getTrendIcon(insight.growthRate)}
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Stats */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Timeline sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        <strong>{insight.ticketVolume}</strong> tickets
                      </Typography>
                    </Box>
                    <Chip
                      label={`${insight.growthRate > 0 ? '+' : ''}${insight.growthRate.toFixed(1)}%`}
                      color={getTrendColor(insight.growthRate)}
                      size="small"
                      icon={<Speed />}
                    />
                  </Box>

                  {/* Dates */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
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
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <InfoOutlined sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="text.secondary">
            No New Insights
      </Typography>
      <Typography variant="body1" color="text.secondary">
            No new insights have been detected for this organization yet. 
            Check back later as our AI analyzes more support tickets.
      </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default InsightsPage;