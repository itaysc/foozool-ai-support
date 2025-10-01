import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { PredictiveInsights } from '@/types/dataIntelligence';

interface PredictiveInsightsCardProps {
  insights: PredictiveInsights;
}

const PredictiveInsightsCard: React.FC<PredictiveInsightsCardProps> = ({ insights }) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return '#f44336';
      case 'Medium': return '#ff9800';
      case 'Low': return '#4caf50';
      default: return '#757575';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4caf50';
    if (confidence >= 0.6) return '#ff9800';
    return '#f44336';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        🔮 Predictive Insights
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#ffebee' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#f44336' }}>
                {insights.escalationRisk.high}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Escalation Risk
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({insights.escalationRisk.percentage}% of predictions)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#fff3e0' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                {insights.csatRisk.high}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High CSAT Risk
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({insights.csatRisk.percentage}% of predictions)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#e8f5e8' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                {insights.resolutionTime.longResolution}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Long Resolution
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({insights.resolutionTime.percentage}% of predictions)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#f3e5f5' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#9c27b0' }}>
                {insights.totalPredictions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Predictions
              </Typography>
              <Typography variant="caption" color="text.secondary">
                (Last 30 days)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Predictions Table */}
      {insights.recentPredictions.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Recent Predictions
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Ticket ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Escalation Risk</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>CSAT Risk</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Long Resolution</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Confidence</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {insights.recentPredictions.map((prediction, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {prediction.ticketId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={prediction.escalationRisk}
                          size="small"
                          sx={{
                            backgroundColor: getRiskColor(prediction.escalationRisk),
                            color: 'white',
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={prediction.csatRisk}
                          size="small"
                          sx={{
                            backgroundColor: getRiskColor(prediction.csatRisk),
                            color: 'white',
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={prediction.longResolution ? 'Yes' : 'No'}
                          size="small"
                          sx={{
                            backgroundColor: prediction.longResolution ? '#f44336' : '#4caf50',
                            color: 'white',
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {(prediction.confidence * 100).toFixed(0)}%
                          </Typography>
                          <Box
                            sx={{
                              width: 40,
                              height: 4,
                              backgroundColor: '#e0e0e0',
                              borderRadius: 2,
                              position: 'relative'
                            }}
                          >
                            <Box
                              sx={{
                                width: `${prediction.confidence * 100}%`,
                                height: '100%',
                                backgroundColor: getConfidenceColor(prediction.confidence),
                                borderRadius: 2
                              }}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(prediction.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PredictiveInsightsCard;
