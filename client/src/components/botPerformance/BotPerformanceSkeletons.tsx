import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Typography,
  Paper
} from '@mui/material';

// KPI Card Skeleton
export const KPICardSkeleton: React.FC = () => (
  <Card elevation={2}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box flex={1}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={32} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="80%" height={16} sx={{ mt: 1 }} />
        </Box>
        <Skeleton variant="circular" width={48} height={48} />
      </Box>
    </CardContent>
  </Card>
);

// KPI Cards Grid Skeleton
export const KPICardsSkeleton: React.FC = () => (
  <Grid container spacing={3} mb={4}>
    {[1, 2, 3, 4].map((index) => (
      <Grid item xs={12} sm={6} md={3} key={index}>
        <KPICardSkeleton />
      </Grid>
    ))}
  </Grid>
);

// Chart Skeleton
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
    <Skeleton variant="text" width="30%" height={24} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" width="100%" height={height} />
    <Box display="flex" justifyContent="center" mt={2} gap={2}>
      {[1, 2, 3, 4].map((index) => (
        <Box key={index} display="flex" alignItems="center" gap={1}>
          <Skeleton variant="circular" width={12} height={12} />
          <Skeleton variant="text" width={60} height={16} />
        </Box>
      ))}
    </Box>
  </Paper>
);

// Charts Section Skeleton
export const ChartsSkeleton: React.FC = () => (
  <Box>
    {/* Performance Trends Chart */}
    <ChartSkeleton height={320} />
    
    {/* Action Breakdown and Response Time Charts */}
    <Grid container spacing={3} mb={3}>
      <Grid item xs={12} md={6}>
        <ChartSkeleton height={280} />
      </Grid>
      <Grid item xs={12} md={6}>
        <ChartSkeleton height={280} />
      </Grid>
    </Grid>
    
    {/* Volume and Quality Charts */}
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <ChartSkeleton height={280} />
      </Grid>
      <Grid item xs={12} md={6}>
        <ChartSkeleton height={280} />
      </Grid>
    </Grid>
  </Box>
);

// Insight Card Skeleton
export const InsightCardSkeleton: React.FC = () => (
  <Card elevation={1} sx={{ mb: 2 }}>
    <CardContent>
      <Box display="flex" alignItems="flex-start" gap={2}>
        <Skeleton variant="circular" width={32} height={32} />
        <Box flex={1}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Skeleton variant="text" width="25%" height={20} />
            <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} />
          </Box>
          <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="100%" height={16} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="90%" height={16} sx={{ mb: 2 }} />
          
          {/* Suggestions */}
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <Skeleton variant="text" width="30%" height={16} />
          </Typography>
          {[1, 2, 3].map((index) => (
            <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
              <Skeleton variant="circular" width={6} height={6} />
              <Skeleton variant="text" width={`${70 + (index * 10)}%`} height={16} />
            </Box>
          ))}
          
          {/* Impact */}
          <Box display="flex" alignItems="center" gap={1} mt={2}>
            <Skeleton variant="text" width="20%" height={16} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// Insights Section Skeleton
export const InsightsSkeleton: React.FC = () => (
  <Box>
    {/* Section Header */}
    <Box mb={3}>
      <Skeleton variant="text" width="40%" height={28} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="70%" height={18} />
    </Box>
    
    {/* Performance Insights */}
    <Box mb={4}>
      <Skeleton variant="text" width="30%" height={24} sx={{ mb: 2 }} />
      {[1, 2, 3].map((index) => (
        <InsightCardSkeleton key={`performance-${index}`} />
      ))}
    </Box>
    
    {/* Business Insights */}
    <Box mb={4}>
      <Skeleton variant="text" width="25%" height={24} sx={{ mb: 2 }} />
      {[1, 2].map((index) => (
        <InsightCardSkeleton key={`business-${index}`} />
      ))}
    </Box>
    
    {/* Recommendations */}
    <Box>
      <Skeleton variant="text" width="35%" height={24} sx={{ mb: 2 }} />
      {[1, 2, 3].map((index) => (
        <InsightCardSkeleton key={`recommendation-${index}`} />
      ))}
    </Box>
  </Box>
);

// Summary Tab Skeleton
export const SummaryTabSkeleton: React.FC = () => (
  <Box>
    {/* Header Stats */}
    <Grid container spacing={3} mb={4}>
      {[1, 2, 3, 4, 5, 6].map((index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
            <Skeleton variant="text" width="60%" height={16} sx={{ mx: 'auto', mb: 1 }} />
            <Skeleton variant="text" width="40%" height={32} sx={{ mx: 'auto' }} />
          </Paper>
        </Grid>
      ))}
    </Grid>
    
    {/* Key Metrics Chart */}
    <ChartSkeleton height={250} />
    
    {/* Recent Performance Table */}
    <Paper elevation={1} sx={{ p: 3 }}>
      <Skeleton variant="text" width="30%" height={24} sx={{ mb: 2 }} />
      {[1, 2, 3, 4, 5].map((index) => (
        <Box key={index} display="flex" justifyContent="space-between" alignItems="center" py={1}>
          <Skeleton variant="text" width="20%" height={16} />
          <Skeleton variant="text" width="15%" height={16} />
          <Skeleton variant="text" width="15%" height={16} />
          <Skeleton variant="text" width="15%" height={16} />
          <Skeleton variant="text" width="15%" height={16} />
        </Box>
      ))}
    </Paper>
  </Box>
);

// Full Dashboard Skeleton
export const DashboardSkeleton: React.FC = () => (
  <Box p={3} maxWidth="1600px" margin="0 auto">
    {/* Header */}
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={300} height={32} />
        </Box>
        <Skeleton variant="text" width={400} height={18} />
      </Box>
      <Box display="flex" gap={2}>
        <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
      </Box>
    </Box>

    {/* Time Range Selector */}
    <Box mb={4}>
      <Box display="flex" gap={1}>
        {[1, 2, 3, 4, 5].map((index) => (
          <Skeleton key={index} variant="rectangular" width={60} height={32} sx={{ borderRadius: 1 }} />
        ))}
      </Box>
    </Box>

    {/* Tabs */}
    <Box borderBottom={1} borderColor="divider" mb={3}>
      <Box display="flex" gap={4}>
        {['Overview', 'Analytics', 'Insights'].map((tab) => (
          <Skeleton key={tab} variant="text" width={80} height={40} />
        ))}
      </Box>
    </Box>

    {/* Content Area */}
    <Box>
      <KPICardsSkeleton />
      <ChartsSkeleton />
    </Box>
  </Box>
);