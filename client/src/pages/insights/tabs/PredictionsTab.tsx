import React from 'react';
import { Box, Typography, Alert, Card, CardContent, Chip, Paper } from '@mui/material';
import { Prediction, PredictionSummary, AccuracyAnalysis } from '@/types/prediction';
import MetricCard from '@/components/insights/MetricCard';
import PageHeader from '@/components/insights/PageHeader';
import { Analytics, Assessment, TrendingUp } from '@mui/icons-material';

interface PredictionsTabProps {
  predictions: Prediction[];
  predictionSummary: PredictionSummary | null;
  accuracyAnalysis: AccuracyAnalysis | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const PredictionsTab: React.FC<PredictionsTabProps> = ({
  predictions,
  predictionSummary,
  accuracyAnalysis,
  loading,
  error,
  onRefresh
}) => {
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Predictions"
        subtitle="AI-powered predictions for ticket resolution and customer behavior"
        loading={loading}
        onRefresh={onRefresh}
      />

      {predictionSummary && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
          gap: 3, 
          mb: 4 
        }}>
          <MetricCard
            title="Total Predictions"
            value={predictionSummary.totalPredictions}
            icon={<Analytics />}
            color="primary"
          />
          <MetricCard
            title="High Escalation Risk"
            value={predictionSummary.highEscalationRisk}
            icon={<Assessment />}
            color="error"
          />
          <MetricCard
            title="High CSAT Risk"
            value={predictionSummary.highCSATRisk}
            icon={<TrendingUp />}
            color="warning"
          />
          <MetricCard
            title="Long Resolution"
            value={predictionSummary.longResolutionPredictions}
            icon={<TrendingUp />}
            color="info"
          />
        </Box>
      )}

      {accuracyAnalysis && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Accuracy Analysis
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, 
              gap: 2 
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                  {accuracyAnalysis.overallAccuracy}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall Accuracy
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                  {accuracyAnalysis.totalChecked}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Checked
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                  {accuracyAnalysis.avgResolutionTime}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Resolution Time
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Recent Predictions
        </Typography>
        
        {!predictions || predictions.length === 0 ? (
          <Alert severity="info">
            No predictions available. Generate predictions to see AI-powered forecasts.
          </Alert>
        ) : (
          <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
              {predictions.slice(0, 10).map((prediction) => (
                <Box key={prediction.ticketId} sx={{ 
                  mb: 1,
                  position: 'relative',
                  border: `1px solid ${
                    prediction.predictedEscalation.risk === 'High' ? '#f44336' : 
                    prediction.predictedEscalation.risk === 'Medium' ? '#ff9800' : '#4caf50'
                  }`,
                  borderRadius: 1,
                  backgroundColor: 'white',
                  p: 1.5,
                  '&:hover': {
                    boxShadow: 1
                  }
                }}>
                  {/* Floating label on top border */}
                  <Typography variant="caption" sx={{
                    position: 'absolute',
                    top: -8,
                    left: 8,
                    backgroundColor: 'white',
                    px: 1,
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    color: 'info.main'
                  }}>
                    Ticket #{prediction.ticketId} - {new Date(prediction.createdAt).toISOString().split('T')[0]}
                  </Typography>
                  
                  {/* Main content row */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontSize: '0.75rem',
                      flex: 1
                    }}>
                      Escalation: {prediction.predictedEscalation.risk} | CSAT: {prediction.predictedCSAT.risk}
                    </Typography>
                    <Chip 
                      label={`${prediction.predictedEscalation.confidence}%`}
                      color={prediction.predictedEscalation.confidence > 80 ? 'success' : prediction.predictedEscalation.confidence > 60 ? 'warning' : 'error'}
                      size="small"
                      sx={{ ml: 1, fontSize: '0.65rem', height: '18px' }}
                    />
                  </Box>
                  
                  {/* Additional details */}
                  <Box sx={{ 
                    backgroundColor: 'grey.50', 
                    p: 0.75, 
                    borderRadius: 0.5, 
                    border: '1px solid',
                    borderColor: 'grey.200',
                    mt: 0.5
                  }}>
                    {prediction.longResolutionPredicted && (
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        fontSize: '0.65rem',
                        display: 'block'
                      }}>
                        <strong>Long Resolution:</strong> Predicted
                      </Typography>
                    )}
                    {prediction.actualOutcome && (
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        fontSize: '0.65rem',
                        display: 'block'
                      }}>
                        <strong>Actual Escalation:</strong> {prediction.actualOutcome.isEscalated ? 'Yes' : 'No'} 
                        {prediction.actualOutcome.accuracyEscalation ? ' ✓' : ' ✗'}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default PredictionsTab;
