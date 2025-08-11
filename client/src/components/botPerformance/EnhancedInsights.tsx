import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  AlertTitle,
  Divider,
  IconButton,
  Tooltip,
  Button,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore,
  TrendingUp,
  TrendingDown,
  Warning,
  Info,
  CheckCircle,
  Schedule,
  Assignment,
  Speed,
  Money,
  Star,
  Build,
  School,
  Business,
  PlayArrow,
  Timeline,
  Group,
  Description
} from '@mui/icons-material';
import botPerformanceService, { EnhancedInsight, ActionStep } from '@/services/bot-performance-service';

interface EnhancedInsightsProps {
  days?: number;
  onRefresh?: () => void;
  useCache?: boolean;
}

const EnhancedInsights: React.FC<EnhancedInsightsProps> = ({ days = 30, onRefresh, useCache = true }) => {
  const [insights, setInsights] = useState<EnhancedInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInsight, setExpandedInsight] = useState<string | false>(false);

  useEffect(() => {
    fetchInsights(useCache);
  }, [days, useCache]);

  const fetchInsights = async (useCacheParam: boolean = true) => {
    try {
      setLoading(true);
      setError(null);
      const data = await botPerformanceService.getEnhancedInsights(days, useCacheParam);
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch enhanced insights');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <Warning color="error" />;
      case 'high': return <TrendingDown color="warning" />;
      case 'medium': return <Info color="info" />;
      case 'low': return <TrendingUp color="success" />;
      case 'info': return <CheckCircle color="action" />;
      default: return <Info />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <Speed color="primary" />;
      case 'cost': return <Money color="success" />;
      case 'quality': return <Star color="warning" />;
      case 'automation': return <Build color="info" />;
      case 'training': return <School color="secondary" />;
      default: return <Business />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return '#ff1744';
      case 'this_week': return '#ff9800';
      case 'this_month': return '#2196f3';
      default: return '#757575';
    }
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Enhanced Actionable Insights
        </Typography>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" mt={1}>
          Generating detailed recommendations...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Error Loading Enhanced Insights</AlertTitle>
        {error}
        <Button onClick={fetchInsights} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Enhanced Actionable Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Step-by-step recommendations with measurable goals and implementation timelines
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => {
            fetchInsights();
            onRefresh?.();
          }}
          startIcon={<PlayArrow />}
        >
          Refresh Insights
        </Button>
      </Box>

      {insights.length === 0 ? (
        <Alert severity="info">
          <AlertTitle>No Insights Available</AlertTitle>
          No actionable insights found for the selected time period. Your bot performance may already be optimized!
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {insights.map((insight) => (
            <Grid item xs={12} key={insight.id}>
              <Card elevation={2}>
                <CardContent>
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    {getTypeIcon(insight.type)}
                    <Box flex={1}>
                      {/* Header */}
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        {getSeverityIcon(insight.severity)}
                        <Typography variant="h6" fontWeight="bold">
                          {insight.title}
                        </Typography>
                        <Chip
                          label={insight.severity.toUpperCase()}
                          color={getSeverityColor(insight.severity) as any}
                          size="small"
                        />
                        <Chip
                          label={insight.category}
                          variant="outlined"
                          size="small"
                        />
                      </Box>

                      {/* Description */}
                      <Typography variant="body1" paragraph>
                        {insight.description}
                      </Typography>

                      {/* Metrics */}
                      <Grid container spacing={2} mb={2}>
                        <Grid item xs={12} sm={6}>
                          <Paper elevation={1} sx={{ p: 2, bgcolor: 'error.50' }}>
                            <Typography variant="body2" color="text.secondary">
                              Current State
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {insight.currentMetric}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Paper elevation={1} sx={{ p: 2, bgcolor: 'success.50' }}>
                            <Typography variant="body2" color="text.secondary">
                              Target Goal
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {insight.targetMetric}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      {/* Business Impact */}
                      <Accordion
                        expanded={expandedInsight === insight.id}
                        onChange={(_, isExpanded) => setExpandedInsight(isExpanded ? insight.id : false)}
                      >
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Action Plan & Business Impact
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          {/* Business Impact Section */}
                          <Box mb={3}>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                              Expected Business Impact
                            </Typography>
                            <Grid container spacing={2}>
                              {insight.businessImpact.costImpact && (
                                <Grid item xs={12} sm={6}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Money color="success" fontSize="small" />
                                    <Typography variant="body2">
                                      <strong>Cost:</strong> {insight.businessImpact.costImpact}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              {insight.businessImpact.timeImpact && (
                                <Grid item xs={12} sm={6}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Schedule color="info" fontSize="small" />
                                    <Typography variant="body2">
                                      <strong>Time:</strong> {insight.businessImpact.timeImpact}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              {insight.businessImpact.satisfactionImpact && (
                                <Grid item xs={12} sm={6}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Star color="warning" fontSize="small" />
                                    <Typography variant="body2">
                                      <strong>Satisfaction:</strong> {insight.businessImpact.satisfactionImpact}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              {insight.businessImpact.automationImpact && (
                                <Grid item xs={12} sm={6}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Build color="primary" fontSize="small" />
                                    <Typography variant="body2">
                                      <strong>Automation:</strong> {insight.businessImpact.automationImpact}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                            </Grid>
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          {/* Action Plan Steps */}
                          <Box mb={3}>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                              Step-by-Step Action Plan
                            </Typography>
                            <Stepper orientation="vertical">
                              {insight.actionPlan.map((step, index) => (
                                <Step key={step.step} active={true}>
                                  <StepLabel>
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <Typography variant="subtitle2" fontWeight="bold">
                                        {step.action}
                                      </Typography>
                                      <Chip
                                        label={step.priority.replace('_', ' ')}
                                        size="small"
                                        style={{
                                          backgroundColor: getPriorityColor(step.priority),
                                          color: 'white',
                                          fontSize: '0.7rem'
                                        }}
                                      />
                                    </Box>
                                  </StepLabel>
                                  <StepContent>
                                    <Paper elevation={1} sx={{ p: 2, mb: 1 }}>
                                      <Typography variant="body2" paragraph>
                                        {step.description}
                                      </Typography>
                                      
                                      <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                          <Box display="flex" alignItems="center" gap={1}>
                                            <Schedule fontSize="small" color="action" />
                                            <Typography variant="caption">
                                              <strong>Time:</strong> {step.estimatedTime}
                                            </Typography>
                                          </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                          <Box display="flex" alignItems="center" gap={1}>
                                            <Timeline fontSize="small" color="action" />
                                            <Typography variant="caption">
                                              <strong>Outcome:</strong> {step.expectedOutcome}
                                            </Typography>
                                          </Box>
                                        </Grid>
                                      </Grid>

                                      {step.measurableGoal && (
                                        <Box mt={1}>
                                          <Typography variant="caption" color="primary">
                                            <strong>Goal:</strong> {step.measurableGoal}
                                          </Typography>
                                        </Box>
                                      )}

                                      {step.toolsRequired && step.toolsRequired.length > 0 && (
                                        <Box mt={1}>
                                          <Typography variant="caption" display="block">
                                            <strong>Tools needed:</strong>
                                          </Typography>
                                          <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                                            {step.toolsRequired.map((tool, toolIndex) => (
                                              <Chip
                                                key={toolIndex}
                                                label={tool}
                                                size="small"
                                                variant="outlined"
                                                style={{ fontSize: '0.65rem', height: '20px' }}
                                              />
                                            ))}
                                          </Box>
                                        </Box>
                                      )}
                                    </Paper>
                                  </StepContent>
                                </Step>
                              ))}
                            </Stepper>
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          {/* Success Criteria */}
                          <Box mb={3}>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                              Success Criteria
                            </Typography>
                            <List dense>
                              {insight.successCriteria.map((criteria, index) => (
                                <ListItem key={index}>
                                  <ListItemIcon>
                                    <CheckCircle color="success" fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={criteria}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>

                          {/* Footer Info */}
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <Box textAlign="center">
                                <Typography variant="caption" color="text.secondary">
                                  Timeline
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {insight.timeline}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Box textAlign="center">
                                <Typography variant="caption" color="text.secondary">
                                  Risk Level
                                </Typography>
                                <Box>
                                  <Chip
                                    label={insight.riskLevel.toUpperCase()}
                                    color={getRiskLevelColor(insight.riskLevel) as any}
                                    size="small"
                                  />
                                </Box>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Box textAlign="center">
                                <Typography variant="caption" color="text.secondary">
                                  Confidence
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {insight.confidence.toUpperCase()}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default EnhancedInsights;