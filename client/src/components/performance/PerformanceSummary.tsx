import React from 'react';
import { Box, Typography, Paper, LinearProgress } from '@mui/material';

interface PerformanceSummaryProps {
  overallAccuracy: number;
  escalationAccuracy: number;
  csatAccuracy: number;
  totalChecked: number;
}

const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({
  overallAccuracy,
  escalationAccuracy,
  csatAccuracy,
  totalChecked
}) => {
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'success';
    if (accuracy >= 60) return 'warning';
    return 'error';
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        📊 System Reliability Overview
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            Overall Prediction Accuracy
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {overallAccuracy.toFixed(1)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={overallAccuracy} 
          sx={{ height: 8, borderRadius: 4 }}
          color={getAccuracyColor(overallAccuracy) as any}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            Escalation Risk Prediction
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {escalationAccuracy.toFixed(1)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={escalationAccuracy} 
          sx={{ height: 8, borderRadius: 4 }}
          color={getAccuracyColor(escalationAccuracy) as any}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            CSAT Risk Prediction
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {csatAccuracy.toFixed(1)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={csatAccuracy} 
          sx={{ height: 8, borderRadius: 4 }}
          color={getAccuracyColor(csatAccuracy) as any}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        Based on {totalChecked} evaluated predictions
      </Typography>
    </Paper>
  );
};

export default PerformanceSummary;
