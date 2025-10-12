import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Chip, Grid } from '@mui/material';
import { HealthScoreFactors } from '@/types/dataIntelligence';

interface HealthScoreCardProps {
  healthScore: HealthScoreFactors;
  customerName?: string;
}

const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ healthScore, customerName }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4caf50'; // Green
    if (score >= 60) return '#ff9800'; // Orange
    if (score >= 40) return '#ff5722'; // Red-orange
    return '#f44336'; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'At Risk';
    return 'Critical';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return '#4caf50';
      case 'declining': return '#f44336';
      default: return '#757575';
    }
  };

  return (
    <Card sx={{ mb: 3, border: `2px solid ${getScoreColor(healthScore.overallScore)}` }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {customerName ? `${customerName} Health Score` : 'Health Score'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={getTrendIcon(healthScore.trend)}
              size="small"
              sx={{ 
                backgroundColor: getTrendColor(healthScore.trend),
                color: 'white',
                fontSize: '0.8rem'
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {healthScore.trend}
            </Typography>
          </Box>
        </Box>

        {/* Overall Score */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: getScoreColor(healthScore.overallScore) }}>
              {healthScore.overallScore}/100
            </Typography>
            <Chip
              label={getScoreLabel(healthScore.overallScore)}
              sx={{
                backgroundColor: getScoreColor(healthScore.overallScore),
                color: 'white',
                fontWeight: 600
              }}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={healthScore.overallScore}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getScoreColor(healthScore.overallScore),
                borderRadius: 4
              }
            }}
          />
        </Box>

        {/* Health Score Breakdown */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#2196f3' }}>
                Support Health (40%)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: getScoreColor(healthScore.supportHealth.score) }}>
                {healthScore.supportHealth.score}/100
              </Typography>
              <LinearProgress
                variant="determinate"
                value={healthScore.supportHealth.score}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#e0e0e0',
                  mt: 1,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getScoreColor(healthScore.supportHealth.score),
                    borderRadius: 2
                  }
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#9c27b0' }}>
                Engagement Health (30%)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: getScoreColor(healthScore.engagementHealth.score) }}>
                {healthScore.engagementHealth.score}/100
              </Typography>
              <LinearProgress
                variant="determinate"
                value={healthScore.engagementHealth.score}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#e0e0e0',
                  mt: 1,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getScoreColor(healthScore.engagementHealth.score),
                    borderRadius: 2
                  }
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#4caf50' }}>
                Business Health (30%)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: getScoreColor(healthScore.businessHealth.score) }}>
                {healthScore.businessHealth.score}/100
              </Typography>
              <LinearProgress
                variant="determinate"
                value={healthScore.businessHealth.score}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#e0e0e0',
                  mt: 1,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getScoreColor(healthScore.businessHealth.score),
                    borderRadius: 2
                  }
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Last Updated */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Last updated: {new Date(healthScore.lastUpdated).toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default HealthScoreCard;
