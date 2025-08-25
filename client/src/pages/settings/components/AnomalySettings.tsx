import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/auth.context';
import { anomalySettingsService } from '@/services/anomaly-settings-service';
import { AnomalyDetectionSettings, UpdateAnomalySettingsRequest } from '@/types/anomaly';

interface AnomalySettingsProps {
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

const AnomalySettings: React.FC<AnomalySettingsProps> = ({ onShowSnackbar }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AnomalyDetectionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<AnomalyDetectionSettings | null>(null);
  
  // Separate state for time window inputs to allow editing
  const [timeInputs, setTimeInputs] = useState({
    short: '',
    medium: '',
    long: ''
  });

  const getOrganizationId = () => {
    if (user?.organization?._id) {
      return user.organization._id;
    }
    return null;
  };

  useEffect(() => {
    const orgId = getOrganizationId();
    if (orgId) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const orgId = getOrganizationId();
      if (!orgId) {
        onShowSnackbar('No organization found', 'error');
        return;
      }

      const fetchedSettings = await anomalySettingsService.getAnomalySettings(orgId);
      setSettings(fetchedSettings);
      setOriginalSettings(fetchedSettings);
      setHasChanges(false);
      
      // Initialize time inputs with formatted values
      setTimeInputs({
        short: anomalySettingsService.formatTimeWindow(fetchedSettings.timeWindows.short),
        medium: anomalySettingsService.formatTimeWindow(fetchedSettings.timeWindows.medium),
        long: anomalySettingsService.formatTimeWindow(fetchedSettings.timeWindows.long)
      });
    } catch (err) {
      onShowSnackbar('Failed to load anomaly detection settings', 'error');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (path: string, value: any) => {
    if (!settings) return;

    const newSettings = { ...settings };
    const pathParts = path.split('.');
    let current: any = newSettings;

    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }

    current[pathParts[pathParts.length - 1]] = value;
    setSettings(newSettings);

    // Check if there are changes
    if (originalSettings) {
      const hasChangesNow = JSON.stringify(newSettings) !== JSON.stringify(originalSettings);
      setHasChanges(hasChangesNow);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    const orgId = getOrganizationId();
    if (!orgId) {
      onShowSnackbar('No organization found', 'error');
      return;
    }

    try {
      setSaving(true);

      const updateData: UpdateAnomalySettingsRequest = {
        volumeThreshold: settings.volumeThreshold,
        sentimentThreshold: settings.sentimentThreshold,
        timeWindows: settings.timeWindows,
        minDataPoints: settings.minDataPoints,
        enabled: settings.enabled,
      };

      const updatedSettings = await anomalySettingsService.updateAnomalySettings(orgId, updateData);
      setSettings(updatedSettings);
      setOriginalSettings(updatedSettings);
      setHasChanges(false);
      onShowSnackbar('Anomaly detection settings updated successfully!', 'success');
    } catch (err) {
      onShowSnackbar('Failed to update anomaly detection settings', 'error');
      console.error('Error updating settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const orgId = getOrganizationId();
    if (!orgId) {
      onShowSnackbar('No organization found', 'error');
      return;
    }

    try {
      setSaving(true);

      const resetSettings = await anomalySettingsService.resetAnomalySettings(orgId);
      setSettings(resetSettings);
      setOriginalSettings(resetSettings);
      setHasChanges(false);
      onShowSnackbar('Anomaly detection settings reset to defaults!', 'success');
    } catch (err) {
      onShowSnackbar('Failed to reset anomaly detection settings', 'error');
      console.error('Error resetting settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setHasChanges(false);
      
      // Reset time inputs to formatted values
      setTimeInputs({
        short: anomalySettingsService.formatTimeWindow(originalSettings.timeWindows.short),
        medium: anomalySettingsService.formatTimeWindow(originalSettings.timeWindows.medium),
        long: anomalySettingsService.formatTimeWindow(originalSettings.timeWindows.long)
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!settings) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load anomaly detection settings</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <SettingsIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h5" component="h2">
          Anomaly Detection Settings
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Configure how anomaly detection works for your organization. These settings control the sensitivity 
        and behavior of the anomaly detection system.
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">General Settings</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled}
                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                color="primary"
              />
            }
            label="Enable Anomaly Detection"
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Volume Threshold (Standard Deviations)"
              type="number"
              value={settings.volumeThreshold}
              onChange={(e) => handleSettingChange('volumeThreshold', parseFloat(e.target.value))}
              inputProps={{ min: 0.5, max: 10, step: 0.1 }}
              helperText="Higher values = less sensitive to volume changes"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Sentiment Threshold"
              type="number"
              value={settings.sentimentThreshold}
              onChange={(e) => handleSettingChange('sentimentThreshold', parseFloat(e.target.value))}
              inputProps={{ min: 0.1, max: 2.0, step: 0.1 }}
              helperText="Higher values = less sensitive to sentiment changes"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Minimum Data Points"
              type="number"
              value={settings.minDataPoints}
              onChange={(e) => handleSettingChange('minDataPoints', parseInt(e.target.value))}
              inputProps={{ min: 3, max: 50 }}
              helperText="Minimum data points required for analysis"
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>Time Windows</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Configure the time windows used for anomaly detection. These determine how far back the system 
          looks when establishing baselines and detecting changes.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader
                title="Short Window"
                subheader="For immediate spikes/drops"
                action={
                  <Tooltip title="Used for detecting sudden changes in ticket volume or sentiment">
                    <IconButton size="small">
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                }
              />
              <CardContent>
                <TextField
                  fullWidth
                  label="Duration"
                  value={timeInputs.short}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setTimeInputs(prev => ({ ...prev, short: inputValue }));
                    
                    try {
                      const ms = anomalySettingsService.parseTimeWindow(inputValue);
                      if (!isNaN(ms) && ms > 0) {
                        handleSettingChange('timeWindows.short', ms);
                      }
                    } catch (error) {
                      // Invalid input, don't update settings
                      console.log('Invalid time format:', inputValue, error);
                    }
                  }}
                  onBlur={() => {
                    // On blur, update the input to show the formatted value
                    if (settings) {
                      setTimeInputs(prev => ({ 
                        ...prev, 
                        short: anomalySettingsService.formatTimeWindow(settings.timeWindows.short) 
                      }));
                    }
                  }}
                  helperText="Format: 1h 30m or 90m"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader
                title="Medium Window"
                subheader="For trend analysis"
                action={
                  <Tooltip title="Used for detecting medium-term trends and patterns">
                    <IconButton size="small">
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                }
              />
              <CardContent>
                <TextField
                  fullWidth
                  label="Duration"
                  value={timeInputs.medium}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setTimeInputs(prev => ({ ...prev, medium: inputValue }));
                    
                    try {
                      const ms = anomalySettingsService.parseTimeWindow(inputValue);
                      if (!isNaN(ms) && ms > 0) {
                        handleSettingChange('timeWindows.medium', ms);
                      }
                    } catch (error) {
                      // Invalid input, don't update settings
                      console.log('Invalid time format:', inputValue, error);
                    }
                  }}
                  onBlur={() => {
                    // On blur, update the input to show the formatted value
                    if (settings) {
                      setTimeInputs(prev => ({ 
                        ...prev, 
                        medium: anomalySettingsService.formatTimeWindow(settings.timeWindows.medium) 
                      }));
                    }
                  }}
                  helperText="Format: 6h or 360m"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader
                title="Long Window"
                subheader="For baseline establishment"
                action={
                  <Tooltip title="Used for establishing long-term baselines and seasonal patterns">
                    <IconButton size="small">
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                }
              />
              <CardContent>
                <TextField
                  fullWidth
                  label="Duration"
                  value={timeInputs.long}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setTimeInputs(prev => ({ ...prev, long: inputValue }));
                    
                    try {
                      const ms = anomalySettingsService.parseTimeWindow(inputValue);
                      if (!isNaN(ms) && ms > 0) {
                        handleSettingChange('timeWindows.long', ms);
                      }
                    } catch (error) {
                      // Invalid input, don't update settings
                      console.log('Invalid time format:', inputValue, error);
                    }
                  }}
                  onBlur={() => {
                    // On blur, update the input to show the formatted value
                    if (settings) {
                      setTimeInputs(prev => ({ 
                        ...prev, 
                        long: anomalySettingsService.formatTimeWindow(settings.timeWindows.long) 
                      }));
                    }
                  }}
                  helperText="Format: 24h or 1d"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <Box display="flex" gap={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadSettings}
          disabled={saving}
        >
          Refresh
        </Button>
        
        {hasChanges && (
          <Button
            variant="outlined"
            onClick={handleDiscardChanges}
            disabled={saving}
          >
            Discard Changes
          </Button>
        )}
        
        <Button
          variant="outlined"
          onClick={handleReset}
          disabled={saving}
          color="warning"
        >
          Reset to Defaults
        </Button>
        
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};

export default AnomalySettings;
