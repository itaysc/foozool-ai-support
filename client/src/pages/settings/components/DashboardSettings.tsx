import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import apiService from '../../../services/api-service';

interface DashboardSettingsProps {
  onShowSnackbar: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void;
}

const DashboardSettings: React.FC<DashboardSettingsProps> = ({ onShowSnackbar }) => {
  const [settings, setSettings] = useState({
    timeRange: 'last_30_days',
    refreshInterval: 5,
    autoRefresh: true,
    defaultView: 'overview',
    showCharts: true,
    showMetrics: true,
    showInsights: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // This would fetch from the actual API endpoint
      // const response = await apiService.dashboardSettings.get('organization-id');
      // setSettings(response.data);
    } catch (error) {
      onShowSnackbar('Failed to fetch dashboard settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // This would save to the actual API endpoint
      // await apiService.dashboardSettings.update('organization-id', settings);
      onShowSnackbar('Dashboard settings saved successfully', 'success');
    } catch (error) {
      onShowSnackbar('Failed to save dashboard settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Dashboard Settings</Typography>
        <Button 
          variant="contained" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <CircularProgress size={20} /> : 'Save Settings'}
        </Button>
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={3}>
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Time Range</Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Default Time Range</InputLabel>
                <Select
                  value={settings.timeRange}
                  onChange={(e) => setSettings({ ...settings, timeRange: e.target.value })}
                  label="Default Time Range"
                >
                  <MenuItem value="last_7_days">Last 7 Days</MenuItem>
                  <MenuItem value="last_30_days">Last 30 Days</MenuItem>
                  <MenuItem value="last_90_days">Last 90 Days</MenuItem>
                  <MenuItem value="all_time">All Time</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Refresh Settings</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoRefresh}
                    onChange={(e) => setSettings({ ...settings, autoRefresh: e.target.checked })}
                  />
                }
                label="Auto Refresh"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Refresh Interval (minutes)"
                type="number"
                value={settings.refreshInterval}
                onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 60 }}
                disabled={!settings.autoRefresh}
              />
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Display Settings</Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Default View</InputLabel>
                <Select
                  value={settings.defaultView}
                  onChange={(e) => setSettings({ ...settings, defaultView: e.target.value })}
                  label="Default View"
                >
                  <MenuItem value="overview">Overview</MenuItem>
                  <MenuItem value="detailed">Detailed</MenuItem>
                  <MenuItem value="analytics">Analytics</MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showCharts}
                    onChange={(e) => setSettings({ ...settings, showCharts: e.target.checked })}
                  />
                }
                label="Show Charts"
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showMetrics}
                    onChange={(e) => setSettings({ ...settings, showMetrics: e.target.checked })}
                  />
                }
                label="Show Metrics"
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showInsights}
                    onChange={(e) => setSettings({ ...settings, showInsights: e.target.checked })}
                  />
                }
                label="Show Insights"
              />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardSettings; 