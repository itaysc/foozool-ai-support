import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  SmartToy,
  Speed,
  CheckCircle,
  AttachMoney,
  SentimentVerySatisfied,
  Refresh,
  Info
} from '@mui/icons-material';

interface BotKPI {
  value: number;
  label: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  description: string;
  format: 'number' | 'percentage' | 'currency' | 'milliseconds' | 'rating';
  change?: number;
  target?: number;
}

interface BotKPICardsProps {
  kpis: {
    ticketsProcessed: BotKPI;
    successRate: BotKPI;
    avgResponseTime: BotKPI;
    costSavings: BotKPI;
    customerSatisfaction: BotKPI;
  } | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const BotKPICards: React.FC<BotKPICardsProps> = ({ kpis, isLoading, onRefresh }) => {
  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'milliseconds':
        return `${(value / 1000).toFixed(1)}s`;
      case 'rating':
        return `${value.toFixed(1)}/5`;
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp color="success" sx={{ fontSize: '1rem' }} />;
      case 'decreasing':
        return <TrendingDown color="error" sx={{ fontSize: '1rem' }} />;
      default:
        return <TrendingFlat color="info" sx={{ fontSize: '1rem' }} />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'success.main';
      case 'decreasing':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  const getKPIIcon = (label: string) => {
    if (label.includes('Tickets')) return <SmartToy color="primary" />;
    if (label.includes('Success')) return <CheckCircle color="success" />;
    if (label.includes('Response')) return <Speed color="info" />;
    if (label.includes('Cost')) return <AttachMoney color="warning" />;
    if (label.includes('Satisfaction')) return <SentimentVerySatisfied color="secondary" />;
    return <SmartToy color="primary" />;
  };

  const getProgressValue = (value: number, target: number, format: string) => {
    if (format === 'milliseconds') {
      // For response time, lower is better, so invert the calculation
      return Math.max(0, Math.min(100, ((target - value) / target) * 100));
    }
    return Math.min(100, (value / target) * 100);
  };

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5].map((index) => (
          <Grid item xs={12} sm={6} lg={2.4} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140 }}>
                <CircularProgress />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!kpis) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No bot performance data available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bot performance metrics will appear here once the system starts processing tickets.
        </Typography>
      </Box>
    );
  }

  const kpiData = [
    { key: 'ticketsProcessed', ...kpis.ticketsProcessed },
    { key: 'successRate', ...kpis.successRate },
    { key: 'avgResponseTime', ...kpis.avgResponseTime },
    { key: 'costSavings', ...kpis.costSavings },
    { key: 'customerSatisfaction', ...kpis.customerSatisfaction },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Bot Performance KPIs
        </Typography>
        {onRefresh && (
          <IconButton onClick={onRefresh} size="small">
            <Refresh />
          </IconButton>
        )}
      </Box>
      
      <Grid container spacing={3}>
        {kpiData.map((kpi, index) => (
          <Grid item xs={12} sm={6} lg={2.4} key={kpi.key}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getKPIIcon(kpi.label)}
                    <Tooltip title={kpi.description}>
                      <Info sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                    </Tooltip>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {getTrendIcon(kpi.trend)}
                    {kpi.change !== undefined && (
                      <Typography 
                        variant="caption" 
                        sx={{ color: getTrendColor(kpi.trend), fontWeight: 'medium' }}
                      >
                        {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}
                        {kpi.format === 'percentage' ? 'pp' : ''}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                  {formatValue(kpi.value, kpi.format)}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {kpi.label}
                </Typography>

                {kpi.target && (
                  <Box mt={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Target: {formatValue(kpi.target, kpi.format)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getProgressValue(kpi.value, kpi.target, kpi.format).toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={getProgressValue(kpi.value, kpi.target, kpi.format)}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 2,
                          backgroundColor: kpi.format === 'milliseconds' && kpi.value > kpi.target
                            ? 'error.main'
                            : kpi.value >= kpi.target * 0.8
                            ? 'success.main'
                            : kpi.value >= kpi.target * 0.6
                            ? 'warning.main'
                            : 'error.main'
                        }
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default BotKPICards;