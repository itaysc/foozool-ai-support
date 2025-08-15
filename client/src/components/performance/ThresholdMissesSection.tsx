import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  AlertTitle,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  Tooltip,
  IconButton,
  Divider
} from '@mui/material';
import { 
  Info as InfoIcon, 
  TrendingUp as TrendingUpIcon,
  Lightbulb as LightbulbIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { ThresholdMissService } from '../../services/thresholdMiss.service';
import { ThresholdSuggestionService } from '../../services/thresholdSuggestion.service';
import apiService from '../../services/api-service';
import { YesNoModal } from '../index';
import { 
  IThresholdMissStats, 
  IThresholdMissSummary, 
  IThresholdMiss 
} from '../../types/thresholdMiss';
import { IThresholdSuggestion } from '../../services/thresholdSuggestion.service';

interface ThresholdMissesSectionProps {
  organizationId: string;
}

const ThresholdMissesSection: React.FC<ThresholdMissesSectionProps> = ({ organizationId }) => {
  const [summary, setSummary] = useState<IThresholdMissSummary | null>(null);
  const [stats, setStats] = useState<IThresholdMissStats[]>([]);
  const [details, setDetails] = useState<IThresholdMiss[]>([]);
  const [suggestions, setSuggestions] = useState<IThresholdSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [showDetails, setShowDetails] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<IThresholdSuggestion | null>(null);
  const [updatingThreshold, setUpdatingThreshold] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Get summary
      const summaryData = await ThresholdMissService.getSummary();
      setSummary(summaryData);

      // Get stats for selected time range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const statsData = await ThresholdMissService.getStats(startDate, endDate);
      setStats(statsData);

      // Calculate suggestions based on stats
      const thresholds = await apiService.actionThresholds.getAll();
      const calculatedSuggestions = ThresholdSuggestionService.calculateSuggestions(statsData, thresholds.data);
      setSuggestions(calculatedSuggestions);

      // Get details if showing details
      if (showDetails) {
        const detailsData = await ThresholdMissService.getDetails(startDate, endDate, 50);
        setDetails(detailsData.misses);
      }
    } catch (error) {
      console.error('Error loading threshold miss data:', error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: IThresholdSuggestion) => {
    setSelectedSuggestion(suggestion);
    setModalOpen(true);
  };

  const handleConfirmThresholdUpdate = async () => {
    if (!selectedSuggestion) return;

    // Close the modal immediately
    setModalOpen(false);
    setSelectedSuggestion(null);

    try {
      // Show loading state
      setUpdatingThreshold(true);
      
      // Step 1: Get the actual threshold ID from the database
      const thresholds = await apiService.actionThresholds.getAll();
      const threshold = thresholds.data.find((t: any) => 
        t.actionType === selectedSuggestion.actionType && 
        t.name === selectedSuggestion.thresholdName
      );

      if (!threshold) {
        throw new Error('Threshold not found in database');
      }

      // Step 2: Update the threshold on the server
      await apiService.actionThresholds.updateThreshold(
        threshold._id, 
        selectedSuggestion.suggestedThreshold
      );

      // Step 3: Fetch fresh thresholds from the server
      const updatedThresholds = await apiService.actionThresholds.getAll();
      
      // Step 4: Fetch fresh stats data
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const updatedStats = await ThresholdMissService.getStats(startDate, endDate);
      const updatedSummary = await ThresholdMissService.getSummary();
      
      // Step 5: Recalculate suggestions with fresh data
      const updatedSuggestions = ThresholdSuggestionService.calculateSuggestions(updatedStats, updatedThresholds.data);
      
      // Step 6: Update all the state with fresh data
      setSummary(updatedSummary);
      setStats(updatedStats);
      setSuggestions(updatedSuggestions);
      
      // Step 7: Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      console.log('Threshold updated successfully');
      
    } catch (error) {
      console.error('Failed to update threshold:', error);
      // Show error feedback (optional - you can add a toast notification here)
    } finally {
      setUpdatingThreshold(false);
    }
  };

  const handleCancelThresholdUpdate = () => {
    setModalOpen(false);
    setSelectedSuggestion(null);
  };

  const getActionTypeColor = (actionType: string) => {
    const colors: { [key: string]: string } = {
      refund: '#f44336',
      coupon: '#4caf50',
      auto_resolve: '#2196f3',
      escalate: '#ff9800',
      priority_change: '#9c27b0',
      auto_reply: '#00bcd4'
    };
    return colors[actionType] || '#757575';
  };

  const getActionTypeDisplayName = (actionType: string) => {
    const names: { [key: string]: string } = {
      refund: 'Refund',
      coupon: 'Coupon',
      auto_resolve: 'Auto Resolve',
      escalate: 'Escalate',
      priority_change: 'Priority Change',
      auto_reply: 'Auto Reply'
    };
    return names[actionType] || actionType;
  };

  const getCalibrationSuggestion = () => {
    if (!summary) return null;

    const { totalMisses, timeRangeStats } = summary;
    const recentMisses = timeRangeStats.last7Days;
    
    // High threshold for suggesting calibration
    if (recentMisses > 50) {
      return {
        severity: 'error' as const,
        title: 'High Threshold Miss Rate Detected',
        message: 'You have a very high number of threshold misses in the last 7 days. Consider lowering your confidence thresholds or reviewing your AI model performance.',
        action: 'Review thresholds immediately'
      };
    } else if (recentMisses > 20) {
      return {
        severity: 'warning' as const,
        title: 'Moderate Threshold Miss Rate',
        message: 'You have a moderate number of threshold misses. Consider calibrating your thresholds to improve action execution rates.',
        action: 'Calibrate thresholds'
      };
    } else if (recentMisses > 10) {
      return {
        severity: 'info' as const,
        title: 'Threshold Calibration Opportunity',
        message: 'You have some threshold misses. Consider fine-tuning your thresholds for better performance.',
        action: 'Consider calibration'
      };
    }
    
    return null;
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      default: return range;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  const suggestion = getCalibrationSuggestion();

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ mr: 2 }}>
          Threshold Miss Analysis
        </Typography>
        {refreshing && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Refreshing data...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Success Message */}
      {showSuccessMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>Success!</AlertTitle>
          Threshold has been updated successfully. The data is being refreshed to show the latest information.
        </Alert>
      )}
      
      {/* Calibration Suggestion */}
      {suggestion && (
        <Alert 
          severity={suggestion.severity} 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              startIcon={<TrendingUpIcon />}
            >
              {suggestion.action}
            </Button>
          }
        >
          <AlertTitle>{suggestion.title}</AlertTitle>
          {suggestion.message}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
        gap: 3,
        mb: 3 
      }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Misses
            </Typography>
            <Typography variant="h4">
              {summary?.totalMisses || 0}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Last 7 Days
            </Typography>
            <Typography variant="h4">
              {summary?.timeRangeStats.last7Days || 0}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Last 30 Days
            </Typography>
            <Typography variant="h4">
              {summary?.timeRangeStats.last30Days || 0}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Last 90 Days
            </Typography>
            <Typography variant="h4">
              {summary?.timeRangeStats.last90Days || 0}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Time Range Selector */}
      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            disabled={refreshing}
          >
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="90d">Last 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Threshold Optimization Suggestions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LightbulbIcon sx={{ mr: 1, color: 'warning.main' }} />
            <Typography variant="h6">
              Threshold Optimization Suggestions
            </Typography>
            {updatingThreshold && (
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Updating...
                </Typography>
              </Box>
            )}
          </Box>

            {showSuggestions && (
              <Box>
                {updatingThreshold ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <CircularProgress size={24} sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Updating threshold and recalculating suggestions...
                    </Typography>
                  </Box>
                ) : suggestions.length > 0 ? (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Based on your threshold miss patterns, here are suggested optimizations to improve action execution rates:
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                      {suggestions.map((suggestion, index) => (
                        <Card key={index} variant="outlined" sx={{ p: 2 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {getActionTypeDisplayName(suggestion.actionType)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {suggestion.thresholdName}
                              </Typography>
                            </Box>
                            <Chip
                              label={suggestion.impact.toUpperCase()}
                              size="small"
                              sx={{ 
                                backgroundColor: ThresholdSuggestionService.getImpactColor(suggestion.impact),
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                          </Box>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              Current: <strong>{suggestion.currentThreshold}</strong> → 
                              Suggested: <strong>{suggestion.suggestedThreshold}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Change: <strong>{(suggestion.changeAmount * 100).toFixed(1)}%</strong> reduction
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                              {suggestion.reasoning}
                            </Typography>
                          </Box>
                          
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleSuggestionClick(suggestion)}
                            disabled={updatingThreshold}
                            sx={{ minWidth: '120px' }}
                          >
                            {updatingThreshold ? (
                              <>
                                <CircularProgress size={16} sx={{ mr: 1 }} />
                                Updating...
                              </>
                            ) : (
                              'Apply Suggestion'
                            )}
                          </Button>
                        </Card>
                      ))}
                    </Box>
                  </>
                ) : (
                  <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
                    No threshold optimization suggestions available. Your current thresholds appear to be well-calibrated!
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

      {/* Statistics Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Threshold Miss Statistics - {getTimeRangeLabel(timeRange)}
          </Typography>
          
          {stats.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Action Type</TableCell>
                    <TableCell>Threshold Name</TableCell>
                    <TableCell align="right">Miss Count</TableCell>
                    <TableCell align="right">Average Miss By</TableCell>
                    <TableCell align="right">Miss Rate (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.map((stat, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip
                          label={getActionTypeDisplayName(stat.actionType)}
                          size="small"
                          sx={{ 
                            backgroundColor: getActionTypeColor(stat.actionType),
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell>{stat.thresholdName}</TableCell>
                      <TableCell align="right">{stat.missCount}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="How much the confidence score missed the threshold">
                          <span>{stat.averageMissBy.toFixed(3)}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${stat.missRate.toFixed(1)}%`}
                          size="small"
                          color={stat.missRate > 50 ? 'error' : stat.missRate > 25 ? 'warning' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
              No threshold misses found for the selected time range.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Details Section */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              Detailed Misses
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setShowDetails(!showDetails)}
              disabled={refreshing}
              sx={{ ml: 2 }}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </Box>

          {showDetails && (
            <>
              {details.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Action Type</TableCell>
                        <TableCell>Threshold</TableCell>
                        <TableCell>Confidence</TableCell>
                        <TableCell>Missed By</TableCell>
                        <TableCell>Ticket Subject</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {details.map((miss) => (
                        <TableRow key={miss._id}>
                          <TableCell>
                            {new Date(miss.occurredAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getActionTypeDisplayName(miss.actionType)}
                              size="small"
                              sx={{ 
                                backgroundColor: getActionTypeColor(miss.actionType),
                                color: 'white'
                              }}
                            />
                          </TableCell>
                          <TableCell>{miss.thresholdName}</TableCell>
                          <TableCell>
                            <Chip
                              label={`${(miss.confidenceScore * 100).toFixed(1)}%`}
                              size="small"
                              color={miss.confidenceScore > 0.7 ? 'success' : miss.confidenceScore > 0.5 ? 'warning' : 'error'}
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="How much the confidence score missed the threshold">
                              <span>{miss.missedBy.toFixed(3)}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {miss.ticketSubject || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
                  No detailed misses found for the selected time range.
                </Typography>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <YesNoModal
        open={modalOpen}
        title="Confirm Threshold Update"
        message={`Are you sure you want to update the threshold for "${selectedSuggestion?.actionType}" from ${selectedSuggestion?.currentThreshold} to ${selectedSuggestion?.suggestedThreshold}?`}
        confirmText="Update Threshold"
        cancelText="Cancel"
        onConfirm={handleConfirmThresholdUpdate}
        onCancel={() => {
          setModalOpen(false);
          setSelectedSuggestion(null);
        }}
        severity="info"
        loading={updatingThreshold}
        onClose={() => {
          setModalOpen(false);
          setSelectedSuggestion(null);
        }}
      />
    </Box>
  );
};

export default ThresholdMissesSection