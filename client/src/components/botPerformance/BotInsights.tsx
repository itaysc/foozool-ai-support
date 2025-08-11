import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Button,
  Divider,
  CircularProgress,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Lightbulb,
  PlayArrow,
  Timeline,
  Assessment,
  ThumbUp,
  AutoFixHigh,
  Speed,
  Psychology,
  Refresh,
  Analytics,
  Info,
  TrendingDown
} from '@mui/icons-material';

interface Recommendation {
  type: 'threshold_adjustment' | 'training_improvement' | 'process_optimization';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  actionItems: string[];
}

interface Prediction {
  metric: string;
  prediction: number;
  confidence: number;
  timeframe: string;
  reasoning: string;
}

interface BenchmarkComparison {
  successRate: { value: number; benchmark: number; status: string };
  responseTime: { value: number; benchmark: number; status: string };
  escalationRate: { value: number; benchmark: number; status: string };
  customerSatisfaction: { value: number; benchmark: number; status: string };
}

interface GeneralInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
  data?: any;
}

interface GeneralRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  actionItems: string[];
  estimatedImpact: string;
}

interface BotInsightsProps {
  recommendations: Recommendation[];
  predictions: Prediction[];
  benchmarks: BenchmarkComparison | null;
  generalInsights?: GeneralInsight[];
  generalRecommendations?: GeneralRecommendation[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const BotInsights: React.FC<BotInsightsProps> = ({
  recommendations = [],
  predictions = [],
  benchmarks,
  generalInsights = [],
  generalRecommendations = [],
  isLoading,
  onRefresh
}) => {
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | false>(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Error color="error" />;
      case 'medium': return <Warning color="warning" />;
      case 'low': return <CheckCircle color="success" />;
      default: return <Lightbulb />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'threshold_adjustment': return <AutoFixHigh color="primary" />;
      case 'training_improvement': return <Psychology color="secondary" />;
      case 'process_optimization': return <Speed color="info" />;
      default: return <Lightbulb />;
    }
  };

  const getBenchmarkStatus = (status: string) => {
    switch (status) {
      case 'excellent': return { color: 'success', icon: <ThumbUp />, label: 'Excellent' };
      case 'good': return { color: 'info', icon: <CheckCircle />, label: 'Good' };
      case 'average': return { color: 'warning', icon: <Warning />, label: 'Average' };
      case 'below_average': return { color: 'error', icon: <Error />, label: 'Below Average' };
      default: return { color: 'default', icon: <Assessment />, label: 'Unknown' };
    }
  };

  const formatBenchmarkValue = (value: number, metric: string) => {
    switch (metric) {
      case 'successRate':
      case 'escalationRate':
        return `${value.toFixed(1)}%`;
      case 'responseTime':
        return `${(value / 1000).toFixed(1)}s`;
      case 'customerSatisfaction':
        return `${value.toFixed(1)}/5`;
      default:
        return value.toFixed(1);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Bot Performance Insights
        </Typography>
        {onRefresh && (
          <IconButton onClick={onRefresh} size="small">
            <Refresh />
          </IconButton>
        )}
      </Box>

      {/* Benchmark Comparison */}
      {benchmarks && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <Assessment color="primary" />
              Industry Benchmark Comparison
            </Typography>
            
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2} mt={2}>
              {Object.entries(benchmarks).map(([metric, data]) => {
                const status = getBenchmarkStatus(data.status);
                const metricLabel = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                
                return (
                  <Box key={metric} p={2} border={1} borderColor="divider" borderRadius={2}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {metricLabel}
                      </Typography>
                      <Chip 
                        icon={status.icon}
                        label={status.label}
                        color={status.color as any}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6" color="primary">
                          {formatBenchmarkValue(data.value, metric)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Your performance
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2" color="text.secondary">
                          {formatBenchmarkValue(data.benchmark, metric)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Industry avg
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Actionable Recommendations */}
      {recommendations.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <Lightbulb color="primary" />
              Actionable Recommendations
              <Chip label={`${recommendations.length} recommendations`} size="small" variant="outlined" />
            </Typography>
            
            <Box mt={2}>
              {recommendations.map((recommendation, index) => (
                <Accordion
                  key={index}
                  expanded={expandedRecommendation === `recommendation-${index}`}
                  onChange={(_, isExpanded) => 
                    setExpandedRecommendation(isExpanded ? `recommendation-${index}` : false)
                  }
                  sx={{ mb: 1, '&:last-child': { mb: 0 } }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                      <Box display="flex" alignItems="center" gap={1}>
                        {getTypeIcon(recommendation.type)}
                        {getPriorityIcon(recommendation.priority)}
                      </Box>
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {recommendation.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {recommendation.description}
                        </Typography>
                      </Box>
                      <Chip 
                        label={recommendation.priority}
                        color={getPriorityColor(recommendation.priority) as any}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <AlertTitle>Expected Impact</AlertTitle>
                        {recommendation.expectedImpact}
                      </Alert>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Action Items:
                      </Typography>
                      <List dense>
                        {recommendation.actionItems.map((item, itemIndex) => (
                          <ListItem key={itemIndex} sx={{ pl: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <PlayArrow color="primary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={item} />
                          </ListItem>
                        ))}
                      </List>
                      
                      <Box mt={2}>
                        <Button 
                          variant="outlined" 
                          size="small"
                          startIcon={<PlayArrow />}
                        >
                          Implement Recommendation
                        </Button>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Performance Predictions */}
      {predictions.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <Timeline color="primary" />
              Performance Predictions
              <Chip label={`${predictions.length} predictions`} size="small" variant="outlined" />
            </Typography>
            
            <Box mt={2}>
              {predictions.map((prediction, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 2,
                    '&:last-child': { mb: 0 }
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {prediction.metric}
                      </Typography>
                      <Typography variant="h5" color="primary" fontWeight="bold">
                        {prediction.prediction.toFixed(1)}
                        {prediction.metric.includes('Rate') ? '%' : 
                         prediction.metric.includes('Cost') ? '$' : ''}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Chip 
                        label={`${prediction.confidence}% confidence`}
                        color={prediction.confidence > 80 ? 'success' : 
                               prediction.confidence > 60 ? 'warning' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                        {prediction.timeframe}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    {prediction.reasoning}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* General Business Insights */}
      {generalInsights.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <Analytics color="primary" />
              Business Intelligence Insights
              <Chip label={`${generalInsights.length} insights`} size="small" variant="outlined" />
            </Typography>
            
            <Grid container spacing={2} mt={1}>
              {generalInsights.map((insight, index) => (
                <Grid item xs={12} md={6} key={insight.id || index}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Chip 
                          label={insight.category}
                          size="small"
                          color={insight.impact === 'positive' ? 'success' : 
                                 insight.impact === 'negative' ? 'error' : 'default'}
                          variant="outlined"
                        />
                        <Chip 
                          label={insight.confidence}
                          size="small"
                          color={insight.confidence === 'high' ? 'success' : 
                                 insight.confidence === 'medium' ? 'warning' : 'default'}
                        />
                      </Box>
                      
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        {insight.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        {insight.description}
                      </Typography>
                      
                      {insight.impact !== 'neutral' && (
                        <Box mt={2}>
                          <Alert 
                            severity={insight.impact === 'positive' ? 'success' : 'warning'} 
                            variant="outlined"
                            sx={{ py: 0.5 }}
                          >
                            <Typography variant="caption">
                              {insight.impact === 'positive' ? 'Positive' : 'Attention Required'} Impact
                            </Typography>
                          </Alert>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* General Recommendations */}
      {generalRecommendations.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <Lightbulb color="secondary" />
              Business Recommendations
              <Chip label={`${generalRecommendations.length} recommendations`} size="small" variant="outlined" />
            </Typography>
            
            <Box mt={2}>
              {generalRecommendations.map((recommendation, index) => (
                <Box 
                  key={recommendation.id || index}
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 2,
                    '&:last-child': { mb: 0 }
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {recommendation.title}
                      </Typography>
                      <Chip 
                        label={recommendation.category}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <Chip 
                      label={recommendation.priority}
                      color={getPriorityColor(recommendation.priority) as any}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {recommendation.description}
                  </Typography>
                  
                  <Alert severity="info" variant="outlined" sx={{ my: 1 }}>
                    <Typography variant="body2">
                      <strong>Expected Impact:</strong> {recommendation.estimatedImpact}
                    </Typography>
                  </Alert>
                  
                  {recommendation.actionItems.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="medium">
                        Action Items:
                      </Typography>
                      <List dense sx={{ mt: 0.5 }}>
                        {recommendation.actionItems.map((item, itemIndex) => (
                          <ListItem key={itemIndex} sx={{ py: 0.25, pl: 0 }}>
                            <ListItemIcon sx={{ minWidth: 24 }}>
                              <CheckCircle color="primary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={item}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {recommendations.length === 0 && predictions.length === 0 && !benchmarks && 
       generalInsights.length === 0 && generalRecommendations.length === 0 && (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Psychology sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Insights Available Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bot performance insights will appear here once we have enough data to analyze.
                Check back after the system has processed more tickets.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default BotInsights;