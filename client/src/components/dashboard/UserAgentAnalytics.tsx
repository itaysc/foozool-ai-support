import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  Avatar,
  IconButton
} from '@mui/material';
import {
  Refresh,
  Phone,
  Computer,
  Tablet,
  Devices
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';


interface UserAgentAnalyticsProps {
  data: {
    totalTickets: number;
    deviceBreakdown: {
      mobile: { count: number; percentage: number };
      desktop: { count: number; percentage: number };
      tablet: { count: number; percentage: number };
    };
    topOS: Array<{ os: string; count: number; percentage: number }>;
    topBrowsers: Array<{ browser: string; count: number; percentage: number }>;
  } | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const COLORS = {
  mobile: '#2196F3',
  desktop: '#4CAF50',
  tablet: '#FF9800'
};





const getDeviceIcon = (device: string) => {
  switch (device) {
    case 'mobile':
      return <Phone />;
    case 'desktop':
      return <Computer />;
    case 'tablet':
      return <Tablet />;
    default:
      return <Devices />;
  }
};

const UserAgentAnalyticsComponent: React.FC<UserAgentAnalyticsProps> = ({
  data,
  loading = false,
  error = null,
  onRefresh
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalTickets === 0) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            <AlertTitle>No Data</AlertTitle>
            No user agent data available for the selected time range.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const deviceData = [
    { name: 'Mobile', value: data.deviceBreakdown?.mobile?.count || 0, percentage: data.deviceBreakdown?.mobile?.percentage || 0, color: COLORS.mobile },
    { name: 'Desktop', value: data.deviceBreakdown?.desktop?.count || 0, percentage: data.deviceBreakdown?.desktop?.percentage || 0, color: COLORS.desktop },
    { name: 'Tablet', value: data.deviceBreakdown?.tablet?.count || 0, percentage: data.deviceBreakdown?.tablet?.percentage || 0, color: COLORS.tablet }
  ].filter(item => item.value > 0);

  const osData = (data.topOS || []).slice(0, 5).map(os => ({
    name: os.os,
    value: os.count,
    percentage: os.percentage
  }));

  const browserData = (data.topBrowsers || []).slice(0, 5).map(browser => ({
    name: browser.browser,
    value: browser.count,
    percentage: browser.percentage
  }));

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          User Agent Analytics
        </Typography>
        {onRefresh && (
          <IconButton onClick={onRefresh} size="small">
            <Refresh />
          </IconButton>
        )}
      </Box>

      <Box display="flex" flexWrap="wrap" gap={3}>
        {/* Device Breakdown */}
        <Box flex="1 1 400px" minWidth="400px">
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Device Breakdown
              </Typography>
              <Box display="flex" justifyContent="center" mb={2}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box display="flex" justifyContent="space-around">
                {deviceData.map((device) => (
                  <Box key={device.name} textAlign="center">
                    <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                      {getDeviceIcon(device.name.toLowerCase())}
                    </Box>
                    <Typography variant="h6">{device.value}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {device.percentage}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* OS Distribution */}
        <Box flex="1 1 400px" minWidth="400px">
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Operating Systems
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={osData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
              <Box mt={2}>
                {osData.map((os) => (
                  <Box key={os.name} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">{os.name}</Typography>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" mr={1}>
                        {os.value}
                      </Typography>
                      <Chip label={`${os.percentage}%`} size="small" />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Browser Distribution */}
        <Box flex="1 1 400px" minWidth="400px">
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Browsers
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={browserData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
              <Box mt={2}>
                {browserData.map((browser) => (
                  <Box key={browser.name} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">{browser.name}</Typography>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" mr={1}>
                        {browser.value}
                      </Typography>
                      <Chip label={`${browser.percentage}%`} size="small" />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default UserAgentAnalyticsComponent; 