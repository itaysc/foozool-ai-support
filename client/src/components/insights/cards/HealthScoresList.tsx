import React from 'react';
import { Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, LinearProgress } from '@mui/material';
import { HealthScoresResponse } from '@/types/dataIntelligence';

interface HealthScoresListProps {
  healthScores: HealthScoresResponse;
}

const HealthScoresList: React.FC<HealthScoresListProps> = ({ healthScores }) => {
  const getScoreColor = (score: number) => {
    if (score >= 70) return '#4caf50';
    if (score >= 40) return '#ff9800';
    return '#f44336';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Healthy';
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
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        🏥 Customer Health Scores
      </Typography>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 150, backgroundColor: '#f5f5f5' }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196f3' }}>
              {healthScores.summary.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Customers
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 150, backgroundColor: '#e8f5e8' }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
              {healthScores.summary.healthy}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Healthy
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 150, backgroundColor: '#fff3e0' }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
              {healthScores.summary.atRisk}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              At Risk
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 150, backgroundColor: '#ffebee' }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#f44336' }}>
              {healthScores.summary.critical}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Critical
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 150, backgroundColor: '#f3e5f5' }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#9c27b0' }}>
              {healthScores.summary.averageScore}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Score
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Health Scores Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Customer Health Score Details
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Segment</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Contract Value</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Health Score</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trend</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {healthScores.customers.map((customer) => (
                  <TableRow key={customer.customerId} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {customer.customerName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={customer.segment || 'N/A'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        ${customer.contractValue ? customer.contractValue.toLocaleString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40 }}>
                          {customer.healthScore}/100
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={customer.healthScore}
                          sx={{
                            width: 60,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getScoreColor(customer.healthScore),
                              borderRadius: 3
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getScoreLabel(customer.healthScore)}
                        size="small"
                        sx={{
                          backgroundColor: getScoreColor(customer.healthScore),
                          color: 'white',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2">
                          {getTrendIcon(customer.trend)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customer.trend}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(customer.lastUpdated).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default HealthScoresList;
