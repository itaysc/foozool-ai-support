import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
import { formatTimeString } from '@/utils/time-format';

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

  // State for tracking selected dropdown values
  const [selectedOptions, setSelectedOptions] = useState({
    short: '',
    medium: '',
    long: ''
  });

  // Quick time options for each window type
  const shortTimeOptions = ['15m', '30m', '1h', '2h', '4h'] as const;
  const mediumTimeOptions = ['2h', '4h', '6h', '8h', '12h'] as const;
  const longTimeOptions = ['12h', '1d', '2d', '3d', '7d', '14d'] as const;

  const getTimeOptionFromMs = (ms: number) => {
    switch (ms) {
      case 15 * 60 * 1000: return '15m';
      case 30 * 60 * 1000: return '30m';
      case 60 * 60 * 1000: return '1h';
      case 2 * 60 * 60 * 1000: return '2h';
      case 4 * 60 * 60 * 1000: return '4h';
      case 6 * 60 * 60 * 1000: return '6h';
      case 8 * 60 * 60 * 1000: return '8h';
      case 12 * 60 * 60 * 1000: return '12h';
      case 24 * 60 * 60 * 1000: return '1d';
      case 2 * 24 * 60 * 60 * 1000: return '2d';
      case 3 * 24 * 60 * 60 * 1000: return '3d';
      case 7 * 24 * 60 * 60 * 1000: return '7d';
      case 14 * 24 * 60 * 60 * 1000: return '14d';
      default: return null;
    }
  };

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

      // Initialize selected options based on current settings
      const shortMs = fetchedSettings.timeWindows.short;
      const mediumMs = fetchedSettings.timeWindows.medium;
      const longMs = fetchedSettings.timeWindows.long;
      
      setSelectedOptions({
        short: getTimeOptionFromMs(shortMs) || '',
        medium: getTimeOptionFromMs(mediumMs) || '',
        long: getTimeOptionFromMs(longMs) || ''
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

    // Create a deep copy to avoid mutating the original object
    const newSettings = JSON.parse(JSON.stringify(settings));
    const pathParts = path.split('.');
    let current: any = newSettings;

    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }

    current[pathParts[pathParts.length - 1]] = value;
    
    setSettings(newSettings);

    // For time window changes, always set hasChanges to true
    if (path.startsWith('timeWindows.')) {
      setHasChanges(true);
    } else {
      // For other changes, check if there are differences
      if (originalSettings) {
        const hasChangesNow = JSON.stringify(newSettings) !== JSON.stringify(originalSettings);
        setHasChanges(hasChangesNow);
      }
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

      // Reset selected options based on original settings
      const shortMs = originalSettings.timeWindows.short;
      const mediumMs = originalSettings.timeWindows.medium;
      const longMs = originalSettings.timeWindows.long;
      
      setSelectedOptions({
        short: getTimeOptionFromMs(shortMs) || '',
        medium: getTimeOptionFromMs(mediumMs) || '',
        long: getTimeOptionFromMs(longMs) || ''
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

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              fullWidth
              label="Volume Threshold (Standard Deviations)"
              type="number"
              value={settings.volumeThreshold}
              onChange={(e) => handleSettingChange('volumeThreshold', parseFloat(e.target.value))}
              inputProps={{ min: 0.5, max: 10, step: 0.1 }}
              helperText="Higher values = less sensitive to volume changes"
            />
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              fullWidth
              label="Sentiment Threshold"
              type="number"
              value={settings.sentimentThreshold}
              onChange={(e) => handleSettingChange('sentimentThreshold', parseFloat(e.target.value))}
              inputProps={{ min: 0.1, max: 2.0, step: 0.1 }}
              helperText="Higher values = less sensitive to sentiment changes"
            />
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              fullWidth
              label="Minimum Data Points"
              type="number"
              value={settings.minDataPoints}
              onChange={(e) => handleSettingChange('minDataPoints', parseInt(e.target.value))}
              inputProps={{ min: 3, max: 50 }}
              helperText="Minimum data points required for analysis"
            />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>Time Windows</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Configure the time windows used for anomaly detection. These determine how far back the system 
          looks when establishing baselines and detecting changes.
        </Typography>

        {/* Quick Time Window Presets */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            Quick Presets:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const shortMs = 30 * 60 * 1000; // 30 minutes
                const mediumMs = 6 * 60 * 60 * 1000; // 6 hours
                const longMs = 24 * 60 * 60 * 1000; // 24 hours
                handleSettingChange('timeWindows.short', shortMs);
                handleSettingChange('timeWindows.medium', mediumMs);
                handleSettingChange('timeWindows.long', longMs);
                setTimeInputs({
                  short: anomalySettingsService.formatTimeWindow(shortMs),
                  medium: anomalySettingsService.formatTimeWindow(mediumMs),
                  long: anomalySettingsService.formatTimeWindow(longMs)
                });
                // Update selected options for dropdowns
                setSelectedOptions({
                  short: '30m',
                  medium: '6h',
                  long: '1d'
                });
                // Ensure hasChanges is set to true after all updates
                setHasChanges(true);
              }}
            >
              Quick (30m / 6h / 24h)
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const shortMs = 60 * 60 * 1000; // 1 hour
                const mediumMs = 12 * 60 * 60 * 1000; // 12 hours
                const longMs = 7 * 24 * 60 * 60 * 1000; // 7 days
                handleSettingChange('timeWindows.short', shortMs);
                handleSettingChange('timeWindows.medium', mediumMs);
                handleSettingChange('timeWindows.long', longMs);
                setTimeInputs({
                  short: anomalySettingsService.formatTimeWindow(shortMs),
                  medium: anomalySettingsService.formatTimeWindow(mediumMs),
                  long: anomalySettingsService.formatTimeWindow(longMs)
                });
                // Update selected options for dropdowns
                setSelectedOptions({
                  short: '1h',
                  medium: '12h',
                  long: '7d'
                });
                // Ensure hasChanges is set to true after all updates
                setHasChanges(true);
              }}
            >
              Standard (1h / 12h / 7d)
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const shortMs = 15 * 60 * 1000; // 15 minutes
                const mediumMs = 2 * 60 * 60 * 1000; // 2 hours
                const longMs = 12 * 60 * 60 * 1000; // 12 hours
                handleSettingChange('timeWindows.short', shortMs);
                handleSettingChange('timeWindows.medium', mediumMs);
                handleSettingChange('timeWindows.long', longMs);
                setTimeInputs({
                  short: anomalySettingsService.formatTimeWindow(shortMs),
                  medium: anomalySettingsService.formatTimeWindow(mediumMs),
                  long: anomalySettingsService.formatTimeWindow(longMs)
                });
                // Update selected options for dropdowns
                setSelectedOptions({
                  short: '15m',
                  medium: '2h',
                  long: '12h'
                });
                // Ensure hasChanges is set to true after all updates
                setHasChanges(true);
              }}
            >
              Fast (15m / 2h / 12h)
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
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
                sx={{ pb: 1 }}
              />
              <CardContent sx={{ pt: 0 }}>
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>Quick Options</InputLabel>
                    <Select
                      value={selectedOptions.short}
                      label="Quick Options"
                      displayEmpty
                      renderValue={(value) => value || "Select option"}
                      onChange={(e) => {
                        const value = e.target.value as typeof shortTimeOptions[number];
                        let ms: number;
                        switch (value) {
                          case '15m': ms = 15 * 60 * 1000; break;
                          case '30m': ms = 30 * 60 * 1000; break;
                          case '1h': ms = 60 * 60 * 1000; break;
                          case '2h': ms = 2 * 60 * 60 * 1000; break;
                          case '4h': ms = 4 * 60 * 60 * 1000; break;
                          default: return;
                        }
                        handleSettingChange('timeWindows.short', ms);
                        setSelectedOptions(prev => ({ ...prev, short: value }));
                        setTimeInputs(prev => ({ 
                          ...prev, 
                          short: anomalySettingsService.formatTimeWindow(ms) 
                        }));
                      }}
                    >
                      {shortTimeOptions.map(option => (
                        <MenuItem key={option} value={option}>
                          {formatTimeString(option)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <TextField
                  fullWidth
                  label="Custom Duration"
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
          </Box>

          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
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
                sx={{ pb: 1 }}
              />
              <CardContent sx={{ pt: 0 }}>
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>Quick Options</InputLabel>
                    <Select
                      value={selectedOptions.medium}
                      label="Quick Options"
                      displayEmpty
                      renderValue={(value) => value || "Select option"}
                      onChange={(e) => {
                        const value = e.target.value as typeof mediumTimeOptions[number];
                        let ms: number;
                        switch (value) {
                          case '2h': ms = 2 * 60 * 60 * 1000; break;
                          case '4h': ms = 4 * 60 * 60 * 1000; break;
                          case '6h': ms = 6 * 60 * 60 * 1000; break;
                          case '8h': ms = 8 * 60 * 60 * 1000; break;
                          case '12h': ms = 12 * 60 * 60 * 1000; break;
                          default: return;
                        }
                        handleSettingChange('timeWindows.medium', ms);
                        setSelectedOptions(prev => ({ ...prev, medium: value }));
                        setTimeInputs(prev => ({ 
                          ...prev, 
                          medium: anomalySettingsService.formatTimeWindow(ms) 
                        }));
                      }}
                    >
                      {mediumTimeOptions.map(option => (
                        <MenuItem key={option} value={option}>
                          {formatTimeString(option)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <TextField
                  fullWidth
                  label="Custom Duration"
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
          </Box>

          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
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
                sx={{ pb: 1 }}
              />
              <CardContent sx={{ pt: 0 }}>
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>Quick Options</InputLabel>
                    <Select
                      value={selectedOptions.long}
                      label="Quick Options"
                      displayEmpty
                      renderValue={(value) => value || "Select option"}
                      onChange={(e) => {
                        const value = e.target.value as typeof longTimeOptions[number];
                        let ms: number;
                        switch (value) {
                          case '12h': ms = 12 * 60 * 60 * 1000; break;
                          case '1d': ms = 24 * 60 * 60 * 1000; break;
                          case '2d': ms = 2 * 24 * 60 * 60 * 1000; break;
                          case '3d': ms = 3 * 24 * 60 * 60 * 1000; break;
                          case '7d': ms = 7 * 24 * 60 * 60 * 1000; break;
                          case '14d': ms = 14 * 24 * 60 * 60 * 1000; break;
                          default: return;
                        }
                        handleSettingChange('timeWindows.long', ms);
                        setSelectedOptions(prev => ({ ...prev, long: value }));
                        setTimeInputs(prev => ({ 
                          ...prev, 
                          long: anomalySettingsService.formatTimeWindow(ms) 
                        }));
                      }}
                    >
                      {longTimeOptions.map(option => (
                        <MenuItem key={option} value={option}>
                          {formatTimeString(option)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <TextField
                  fullWidth
                  label="Custom Duration"
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
          </Box>
        </Box>
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
