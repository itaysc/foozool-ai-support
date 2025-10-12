import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Chip, LinearProgress } from '@mui/material';
import { DataIntelligenceMetrics } from '@/types/dataIntelligence';

interface DataIntelligenceDashboardProps {
  metrics: DataIntelligenceMetrics;
}

const DataIntelligenceDashboard: React.FC<DataIntelligenceDashboardProps> = ({ metrics }) => {
  const getHealthScoreColor = (score: number) => {
    if (score >= 70) return '#4caf50';
    if (score >= 40) return '#ff9800';
    return '#f44336';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 70) return 'Healthy';
    if (score >= 40) return 'At Risk';
    return 'Critical';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        📊 Data Intelligence Dashboard
      </Typography>

      {/* Portfolio Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2196f3' }}>
            🏢 Customer Portfolio Overview
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196f3' }}>
                  {metrics.portfolio.totalCustomers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Customers
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                  {metrics.portfolio.healthyCustomers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Healthy (≥70)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                  {metrics.portfolio.atRiskCustomers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  At Risk (40-69)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#f44336' }}>
                  {metrics.portfolio.criticalCustomers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Critical (&lt;40)
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Average Health Score: {metrics.portfolio.averageHealthScore}/100
            </Typography>
            <LinearProgress
              variant="determinate"
              value={metrics.portfolio.averageHealthScore}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getHealthScoreColor(metrics.portfolio.averageHealthScore),
                  borderRadius: 3
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Support Intelligence */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#ff5722' }}>
            🎫 Support Intelligence
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff5722' }}>
                  {metrics.supportIntelligence.totalTickets}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Tickets (30d)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                  {metrics.supportIntelligence.avgResolutionTime}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Resolution Time
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#f44336' }}>
                  {(metrics.supportIntelligence.escalationRate * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Escalation Rate
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/* Top Issues */}
          {metrics.supportIntelligence.topIssues.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Top Issues:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {metrics.supportIntelligence.topIssues.map((issue, index) => (
                  <Chip
                    key={index}
                    label={`${issue.issue} (${issue.frequency})`}
                    size="small"
                    sx={{
                      backgroundColor: getImpactColor(issue.impact),
                      color: 'white',
                      fontSize: '0.7rem'
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Predictive Insights */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#9c27b0' }}>
            🔮 Predictive Insights
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#f44336' }}>
                  {metrics.predictiveInsights.churnRisk.high}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  High Churn Risk
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                  {metrics.predictiveInsights.churnRisk.medium}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Medium Churn Risk
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                  {metrics.predictiveInsights.expansionOpportunities}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Expansion Opportunities
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196f3' }}>
                  {metrics.predictiveInsights.upcomingRenewals}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upcoming Renewals
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Business Impact */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#4caf50' }}>
            💰 Business Impact
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                  ${(metrics.businessImpact.totalContractValue / 1000).toFixed(0)}K
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Contract Value
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#f44336' }}>
                  ${(metrics.businessImpact.atRiskRevenue / 1000).toFixed(0)}K
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  At Risk Revenue
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196f3' }}>
                  ${(metrics.businessImpact.expansionPotential / 1000).toFixed(0)}K
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Expansion Potential
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#9c27b0' }}>
                  ${(metrics.businessImpact.customerLifetimeValue / 1000).toFixed(0)}K
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg CLV
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DataIntelligenceDashboard;
