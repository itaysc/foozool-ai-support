import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Refresh,
  AutorenewOutlined,
  TrendingUp,
  Psychology,
  VerifiedUser,
  AutoAwesome
} from '@mui/icons-material';
import { Prediction, PredictionSummary, AccuracyAnalysis } from '@/types/prediction';
import { insightsService } from '@/services/insights-service';
import { useAuth } from '@/context/auth.context';
import { MetricCard, AccuracyChart, PerformanceSummary } from '@/components';
import ThresholdMissesSection from '@/components/performance/ThresholdMissesSection';

const PerformancePage: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [predictionSummary, setPredictionSummary] = useState<PredictionSummary | null>(null);
  const [accuracyAnalysis, setAccuracyAnalysis] = useState<AccuracyAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { organizationId } = useParams<{ organizationId: string }>();
  const { user } = useAuth();

  const effectiveOrgId = organizationId || (user?.organization as string) || 'demo-org-id';

  useEffect(() => {
    if (!effectiveOrgId) {
      setError('Organization ID is required');
      setLoading(false);
      return;
    }

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              🤖 AI Performance & System Reliability
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Comprehensive analysis of prediction accuracy and system performance
            </Typography>
          </Box>
          <Tooltip title="Refresh performance data">
            <IconButton 
              onClick={refreshData} 
              disabled={loading}
              sx={{ 
                backgroundColor: '#ffffff',
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
            >
              {loading ? <AutorenewOutlined sx={{ animation: 'spin 1s linear infinite' }} /> : <Refresh />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Key Performance Indicators */}
      {accuracyAnalysis && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 4 
        }}>
          <MetricCard
            title="Overall Accuracy"
            value={`${accuracyAnalysis.overallAccuracy.toFixed(1)}%`}
            subtitle={`${accuracyAnalysis.totalChecked} tickets evaluated`}
            color="primary.main"
            icon={<VerifiedUser sx={{ fontSize: 40, color: 'primary.main' }} />}
          />
          <MetricCard
            title="Escalation Accuracy"
            value={`${accuracyAnalysis.escalationAccuracy.percentage.toFixed(1)}%`}
            subtitle={`${accuracyAnalysis.escalationAccuracy.correct}/${accuracyAnalysis.escalationAccuracy.total} correct`}
            color="secondary.main"
            icon={<TrendingUp sx={{ fontSize: 40, color: 'secondary.main' }} />}
          />
          <MetricCard
            title="CSAT Accuracy"
            value={`${accuracyAnalysis.csatAccuracy.percentage.toFixed(1)}%`}
            subtitle={`${accuracyAnalysis.csatAccuracy.correct}/${accuracyAnalysis.csatAccuracy.total} correct`}
            color="success.main"
            icon={<Psychology sx={{ fontSize: 40, color: 'success.main' }} />}
          />
          <MetricCard
            title="Total Predictions"
            value={predictions.length}
            subtitle={`${predictionSummary?.highEscalationRisk || 0} high-risk flagged`}
            color="warning.main"
            icon={<AutoAwesome sx={{ fontSize: 40, color: 'warning.main' }} />}
          />
        </Box>
      )}

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
        {accuracyAnalysis && (
          <PerformanceSummary
            overallAccuracy={accuracyAnalysis.overallAccuracy}
            escalationAccuracy={accuracyAnalysis.escalationAccuracy.percentage}
            csatAccuracy={accuracyAnalysis.csatAccuracy.percentage}
            totalChecked={accuracyAnalysis.totalChecked}
          />
        )}
      </Box>

      {/* Resolution Time Prediction Accuracy */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
          ⏱️ Resolution Time Prediction Accuracy
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 3 
        }}>
          <Box sx={{ 
            p: 3, 
            backgroundColor: '#ffffff', 
            borderRadius: 2, 
            border: '1px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800', mb: 1 }}>
              {predictionSummary?.longResolutionPredictions || 0}
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
              Long Resolution Predictions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tickets flagged as potentially taking longer to resolve
            </Typography>
          </Box>
          
          <Box sx={{ 
            p: 3, 
            backgroundColor: '#ffffff', 
            borderRadius: 2, 
            border: '1px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50', mb: 1 }}>
              {accuracyAnalysis?.resolutionTimeAccuracy?.correct || 0}
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
              Accurate Predictions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Correctly predicted long resolution time
            </Typography>
          </Box>
          
          <Box sx={{ 
            p: 3, 
            backgroundColor: '#ffffff', 
            borderRadius: 2, 
            border: '1px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f44336', mb: 1 }}>
              {accuracyAnalysis?.resolutionTimeAccuracy ? 
                (accuracyAnalysis.resolutionTimeAccuracy.total - accuracyAnalysis.resolutionTimeAccuracy.correct) : 0}
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
              False Positives
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Predicted long but resolved quickly
            </Typography>
          </Box>
        </Box>
        
        {/* Detailed Resolution Time Analysis */}
        <Box sx={{ mt: 3, p: 3, backgroundColor: '#ffffff', borderRadius: 2, border: '1px solid #e0e0e0' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            📊 Resolution Time Distribution
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            mt: 2
          }}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Average Resolution Time (Predicted Long):
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {accuracyAnalysis?.avgPredictedLongResolutionTime ? 
                  `${accuracyAnalysis.avgPredictedLongResolutionTime} hours` : 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Average Resolution Time (All Tickets):
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {accuracyAnalysis?.avgResolutionTime ? 
                  `${accuracyAnalysis.avgResolutionTime} hours` : 'N/A'}
              </Typography>
            </Box>
          </Box>
          
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
        </Box>
      </Box>

      {/* System Reliability Score */}
      {accuracyAnalysis && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mb: 4
        }}>
          <Box sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 2,
            color: 'white',
            textAlign: 'center'
          }}>
            <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              {Math.round(accuracyAnalysis.overallAccuracy)}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              System Reliability Score
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
              Based on {accuracyAnalysis.totalChecked} evaluated predictions
            </Typography>
          </Box>
          
          <Box sx={{ p: 3, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
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
          </Box>
        </Box>
      )}

      {/* Threshold Misses Analysis */}
      <Box sx={{ mb: 4 }}>
        <ThresholdMissesSection organizationId={effectiveOrgId} />
      </Box>
    </Box>
  );
};

export default PerformancePage;
