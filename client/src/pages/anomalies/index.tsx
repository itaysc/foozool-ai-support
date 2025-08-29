import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  CircularProgress,
  Alert,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Grid,
  Stack,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import { 
  Warning,
  BugReport,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Cancel,
  Flag,
  Refresh,
  PlayArrow,
  Info,
  Schedule,
  Speed,
  Settings as SettingsIcon,
  History
} from '@mui/icons-material';
import { Anomaly, AnomalyFilter, AnomalyStats } from '@/types/anomaly';
import { anomaliesService } from '@/services/anomalies-service';
import { useAuth } from '@/context/auth.context';
import config from '@/config';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`anomalies-tabpanel-${index}`}
      aria-labelledby={`anomalies-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AnomaliesPage: React.FC = () => {
  const navigate = useNavigate();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [stats, setStats] = useState<AnomalyStats>({
    totalActive: 0,
    bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
    byType: { volume: 0, sentiment: 0 },
    recentActivity: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [filter, setFilter] = useState<AnomalyFilter>({
    status: 'active',
    type: '',
    severity: '',
    hours: 24
  });
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'acknowledge' | 'resolve' | 'false-positive' | null;
    anomaly: Anomaly | null;
    notes: string;
  }>({
    open: false,
    type: null,
    anomaly: null,
    notes: ''
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const { organizationId } = useParams<{ organizationId: string }>();
  const { user } = useAuth();

  // Use organization ID from URL parameter, or from authenticated user
  const getOrganizationId = (org: any): string | null => {
    if (typeof org === 'string') return org;
    if (org && typeof org === 'object' && org._id) return org._id;
    return null;
  };
  
  const effectiveOrgId = organizationId || getOrganizationId(user?.organization);

  const loadAnomalies = async () => {
    try {
      setLoading(true);
      const response = await anomaliesService.getAnomalies(filter, pagination);
      console.log('Anomalies response:', response);
      
      // Ensure we have a valid anomalies array
      if (response && Array.isArray(response.anomalies)) {
        setAnomalies(response.anomalies);
        setTotalPages(Math.ceil((response.totalCount || 0) / pagination.limit));
      } else {
        console.error('Invalid response structure:', response);
        // Try to extract anomalies from different possible response structures
        let anomaliesArray: Anomaly[] = [];
        let totalCount = 0;
        
        if (response && Array.isArray(response)) {
          // If response is directly an array
          anomaliesArray = response;
          totalCount = response.length;
        } else if (response && typeof response === 'object') {
          // If response is an object, try to extract anomalies
          const anyResponse = response as any;
          if (Array.isArray(anyResponse.anomalies)) {
            anomaliesArray = anyResponse.anomalies;
            totalCount = anyResponse.totalCount || 0;
          }
        }
        
        // Fallback to empty array if nothing worked
        if (anomaliesArray.length === 0) {
          anomaliesArray = [];
          totalCount = 0;
        }
        
        setAnomalies(anomaliesArray);
        setTotalPages(Math.ceil(totalCount / pagination.limit));
      }
    } catch (err: any) {
      console.error('Error loading anomalies:', err);
      setError(err.message || 'Failed to load anomalies');
      setAnomalies([]); // Ensure anomalies is always an array
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await anomaliesService.getAnomalyStats(filter.hours as number);
      console.log('Stats response:', response);
      console.log('bySeverity:', response?.bySeverity);
      console.log('high:', response?.bySeverity?.high);
      console.log('critical:', response?.bySeverity?.critical);
      
      // Ensure the response has the complete structure
      const safeStats: AnomalyStats = {
        totalActive: response?.totalActive || 0,
        bySeverity: {
          low: response?.bySeverity?.low || 0,
          medium: response?.bySeverity?.medium || 0,
          high: response?.bySeverity?.high || 0,
          critical: response?.bySeverity?.critical || 0
        },
        byType: {
          volume: response?.byType?.volume || 0,
          sentiment: response?.byType?.sentiment || 0
        },
        recentActivity: response?.recentActivity || 0
      };
      
      console.log('Safe stats:', safeStats);
      setStats(safeStats);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      // Keep the default stats on error, don't break the UI
    }
  };

  const triggerDetection = async () => {
    try {
      await anomaliesService.triggerAnomalyDetection();
      setSnackbar({
        open: true,
        message: 'Anomaly detection started successfully',
        severity: 'success'
      });
      // Reload data after a delay
      setTimeout(() => {
        loadAnomalies();
        loadStats();
      }, 5000);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to trigger detection',
        severity: 'error'
      });
    }
  };

  const triggerDetectionFromBeginning = async () => {
    try {
      setSnackbar({
        open: true,
        message: 'Starting anomaly detection from beginning of time...',
        severity: 'info'
      });
      
      await anomaliesService.triggerAnomalyDetectionFromBeginning();
      
      setSnackbar({
        open: true,
        message: 'Anomaly detection from beginning started successfully. This may take a while...',
        severity: 'success'
      });
      
      // Reload data after a longer delay since this is a more intensive operation
      setTimeout(() => {
        loadAnomalies();
        loadStats();
      }, 10000);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to trigger detection from beginning',
        severity: 'error'
      });
    }
  };

  const handleAction = async () => {
    if (!actionDialog.anomaly || !actionDialog.type) return;

    try {
      let response;
      switch (actionDialog.type) {
        case 'acknowledge':
          response = await anomaliesService.acknowledgeAnomaly(actionDialog.anomaly._id, { notes: actionDialog.notes });
          break;
        case 'resolve':
          response = await anomaliesService.resolveAnomaly(actionDialog.anomaly._id, { notes: actionDialog.notes });
          break;
        case 'false-positive':
          response = await anomaliesService.markAsFalsePositive(actionDialog.anomaly._id, { notes: actionDialog.notes });
          break;
      }

      setSnackbar({
        open: true,
        message: response.message || 'Action completed successfully',
        severity: 'success'
      });

      setActionDialog({ ...actionDialog, open: false });
      loadAnomalies();
      loadStats();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to perform action',
        severity: 'error'
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'error';
      case 'acknowledged': return 'warning';
      case 'resolved': return 'success';
      case 'false_positive': return 'default';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'volume' ? <TrendingUp /> : <BugReport />;
  };

  useEffect(() => {
    if (!effectiveOrgId) {
      setError('No organization ID available. Please ensure you are properly authenticated and have access to an organization.');
      setLoading(false);
      return;
    }

    loadAnomalies();
    loadStats();
  }, [effectiveOrgId, filter, pagination]);

  // Debug effect to log stats changes
  useEffect(() => {
    console.log('Stats state changed:', stats);
    console.log('bySeverity:', stats?.bySeverity);
    console.log('high + critical:', (stats?.bySeverity?.high || 0) + (stats?.bySeverity?.critical || 0));
  }, [stats]);

  // Ensure anomalies is always an array
  const safeAnomalies = Array.isArray(anomalies) ? anomalies : [];
  
  if (!effectiveOrgId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error || 'No organization ID available'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Anomaly Detection
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => navigate(`/settings?tab=anomalies`)}
          >
            Settings
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={triggerDetection}
            sx={{ bgcolor: 'success.main' }}
          >
            Trigger Detection
          </Button>
          {/* Only show this button in non-production environments */}
          {config.environment !== 'production' && (
            <Button
              variant="contained"
              startIcon={<History />}
              onClick={triggerDetectionFromBeginning}
              sx={{ bgcolor: 'warning.main' }}
              title="Trigger anomaly detection from the beginning of time (development only)"
            >
              Detect from Beginning
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2, 
          mb: 3,
          '& > *': { flex: '1 1 160px', minWidth: '160px', maxWidth: '200px' }
        }}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            height: '120px',
            boxShadow: 1,
            '&:hover': { boxShadow: 3 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Warning sx={{ fontSize: 24, color: 'error.main' }} />
            </Box>
            <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {stats.totalActive}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
              Active
            </Typography>
          </Paper>
          
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            height: '120px',
            boxShadow: 1,
            '&:hover': { boxShadow: 3 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Schedule sx={{ fontSize: 24, color: 'info.main' }} />
            </Box>
            <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {stats.recentActivity}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
              Recent
            </Typography>
          </Paper>
          
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            height: '120px',
            boxShadow: 1,
            '&:hover': { boxShadow: 3 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <TrendingUp sx={{ fontSize: 24, color: 'warning.main' }} />
            </Box>
            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {(() => {
                const high = Number(stats?.bySeverity?.high) || 0;
                const critical = Number(stats?.bySeverity?.critical) || 0;
                const sum = high + critical;
                console.log('High:', high, 'Critical:', critical, 'Sum:', sum);
                return sum;
              })()}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
              High/Critical
            </Typography>
          </Paper>
          
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            height: '120px',
            boxShadow: 1,
            '&:hover': { boxShadow: 3 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Speed sx={{ fontSize: 24, color: 'primary.main' }} />
            </Box>
            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {stats.byType.volume}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
              Volume
            </Typography>
          </Paper>
          
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            height: '120px',
            boxShadow: 1,
            '&:hover': { boxShadow: 3 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <BugReport sx={{ fontSize: 24, color: 'secondary.main' }} />
            </Box>
            <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {stats.byType.sentiment}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
              Sentiment
            </Typography>
          </Paper>
          
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center',
            height: '120px',
            boxShadow: 1,
            '&:hover': { boxShadow: 3 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <CheckCircle sx={{ fontSize: 24, color: 'success.main' }} />
            </Box>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {stats.bySeverity.low}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
              Low Risk
            </Typography>
          </Paper>
        </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2, 
          alignItems: 'center',
          '& > *': { flex: '1 1 200px', minWidth: '200px' }
        }}>
          <FormControl fullWidth size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filter.status}
              label="Status"
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              sx={{ height: 40 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="acknowledged">Acknowledged</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="false_positive">False Positive</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filter.type}
              label="Type"
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              sx={{ height: 40 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="volume">Volume</MenuItem>
              <MenuItem value="sentiment">Sentiment</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Severity</InputLabel>
            <Select
              value={filter.severity}
              label="Severity"
              onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
              sx={{ height: 40 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
            </FormControl>
          
          <FormControl fullWidth size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Time Window</InputLabel>
            <Select
              value={filter.hours}
              label="Time Window"
              onChange={(e) => setFilter({ ...filter, hours: e.target.value })}
              sx={{ height: 40 }}
            >
              <MenuItem value={24}>Last 24h</MenuItem>
              <MenuItem value={48}>Last 48h</MenuItem>
              <MenuItem value={168}>Last 7 days</MenuItem>
              <MenuItem value="all">All time</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              setPagination({ ...pagination, offset: 0 });
              loadAnomalies();
            }}
            sx={{ height: 40, minWidth: 100 }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Anomalies List */}
      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !anomalies || !Array.isArray(anomalies) || anomalies.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" color="textSecondary">
              No anomalies found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Try adjusting your filters or trigger anomaly detection
            </Typography>
          </Box>
        ) : (
          <>
            {Array.isArray(anomalies) && anomalies.map((anomaly) => (
               <Paper key={anomaly._id} sx={{ mb: 2, p: 3, boxShadow: 2, '&:hover': { boxShadow: 4 } }}>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                     <Box sx={{ 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'center',
                       width: 48,
                       height: 48,
                       borderRadius: '50%',
                       bgcolor: anomaly.type === 'volume' ? 'primary.light' : 'secondary.light',
                       color: anomaly.type === 'volume' ? 'primary.dark' : 'secondary.dark'
                     }}>
                       {getTypeIcon(anomaly.type)}
                     </Box>
                     <Box sx={{ flex: 1 }}>
                       <Typography variant="h6" sx={{ mb: 0.5 }}>
                         {anomaly.description}
                       </Typography>
                       <Typography variant="body2" color="textSecondary">
                         {anomaly.metadata.affectedMetrics.join(', ')} • Confidence: {(anomaly.metadata.confidence * 100).toFixed(1)}%
                       </Typography>
                     </Box>
                   </Box>
                   <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                     <Chip
                       label={anomaly.type}
                       size="small"
                       icon={anomaly.type === 'volume' ? <TrendingUp /> : <BugReport />}
                       sx={{ bgcolor: anomaly.type === 'volume' ? 'primary.light' : 'secondary.light' }}
                     />
                     <Chip
                       label={anomaly.severity}
                       color={getSeverityColor(anomaly.severity) as any}
                       size="small"
                     />
                     <Chip
                       label={anomaly.status}
                       color={getStatusColor(anomaly.status) as any}
                       size="small"
                     />
                   </Box>
                 </Box>

                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                     <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                       <Schedule sx={{ fontSize: 16 }} />
                       Detected {anomaly.ageInHours ? `${anomaly.ageInHours}h ago` : 'recently'}
                     </Typography>
                     {anomaly.acknowledgedAt && (
                       <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                         <CheckCircle sx={{ fontSize: 16 }} />
                         Acknowledged {anomaly.timeSinceAcknowledgment ? `${anomaly.timeSinceAcknowledgment}h ago` : 'recently'}
                       </Typography>
                     )}
                   </Box>
                   
                   <Box sx={{ display: 'flex', gap: 1 }}>
                     {anomaly.status === 'active' && (
                       <>
                         <Button
                           size="small"
                           variant="outlined"
                           startIcon={<CheckCircle />}
                           onClick={() => setActionDialog({
                             open: true,
                             type: 'acknowledge',
                             anomaly,
                             notes: ''
                           })}
                           sx={{ minWidth: 100 }}
                         >
                           Acknowledge
                         </Button>
                         <Button
                           size="small"
                           variant="outlined"
                           startIcon={<Flag />}
                           onClick={() => setActionDialog({
                             open: true,
                             type: 'resolve',
                             anomaly,
                             notes: ''
                           })}
                           sx={{ minWidth: 100 }}
                         >
                           Resolve
                         </Button>
                         <Button
                           size="small"
                           variant="outlined"
                           startIcon={<Cancel />}
                           onClick={() => setActionDialog({
                             open: true,
                             type: 'false-positive',
                             anomaly,
                             notes: ''
                           })}
                           sx={{ minWidth: 100 }}
                         >
                           False Positive
                         </Button>
                       </>
                     )}
                     {anomaly.status === 'acknowledged' && (
                       <Button
                         size="small"
                         variant="outlined"
                         startIcon={<Flag />}
                         onClick={() => setActionDialog({
                           open: true,
                           type: 'resolve',
                           anomaly,
                           notes: ''
                         })}
                         sx={{ minWidth: 100 }}
                       >
                         Resolve
                       </Button>
                     )}
                   </Box>
                 </Box>
               </Paper>
             ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={Math.floor(pagination.offset / pagination.limit) + 1}
                  onChange={(_, page) => setPagination({
                    ...pagination,
                    offset: (page - 1) * pagination.limit
                  })}
                />
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ ...actionDialog, open: false })}>
        <DialogTitle>
          {actionDialog.type === 'acknowledge' && 'Acknowledge Anomaly'}
          {actionDialog.type === 'resolve' && 'Resolve Anomaly'}
          {actionDialog.type === 'false-positive' && 'Mark as False Positive'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (optional)"
            value={actionDialog.notes}
            onChange={(e) => setActionDialog({ ...actionDialog, notes: e.target.value })}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ ...actionDialog, open: false })}>
            Cancel
          </Button>
          <Button onClick={handleAction} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AnomaliesPage;
