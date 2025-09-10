import React from 'react';
import { Box, Typography, Alert, Card, CardContent, LinearProgress, Paper } from '@mui/material';
import { NPSInsights } from '@/types/nps';
import MetricCard from '@/components/insights/MetricCard';
import PageHeader from '@/components/insights/PageHeader';
import { Assessment, TrendingUp, People, ThumbUp } from '@mui/icons-material';

interface NPSInsightsTabProps {
  npsInsights: NPSInsights | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const NPSInsightsTab: React.FC<NPSInsightsTabProps> = ({
  npsInsights,
  loading,
  error,
  onRefresh
}) => {
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!npsInsights) {
    return (
      <Box>
        <PageHeader
          title="NPS Insights"
          subtitle="Net Promoter Score analysis and customer satisfaction metrics"
          loading={loading}
          onRefresh={onRefresh}
        />
        <Alert severity="info">
          No NPS data available. Generate NPS insights to see customer satisfaction analysis.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="NPS Insights"
        subtitle="Net Promoter Score analysis and customer satisfaction metrics"
        loading={loading}
        onRefresh={onRefresh}
      />

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
        gap: 3, 
        mb: 4 
      }}>
        <MetricCard
          title="NPS Score"
          value={npsInsights.currentNPS}
          trend={npsInsights.npsChange}
          icon={<Assessment />}
          color={npsInsights.currentNPS > 50 ? 'success' : npsInsights.currentNPS > 0 ? 'warning' : 'error'}
        />
        <MetricCard
          title="Promoters"
          value={`${npsInsights.segmentBreakdown.promoters}%`}
          icon={<ThumbUp />}
          color="success"
        />
        <MetricCard
          title="Passives"
          value={`${npsInsights.segmentBreakdown.passives}%`}
          icon={<People />}
          color="warning"
        />
        <MetricCard
          title="Detractors"
          value={`${npsInsights.segmentBreakdown.detractors}%`}
          icon={<TrendingUp />}
          color="error"
        />
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
        gap: 3 
      }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              NPS Distribution
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Promoters (9-10)</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {npsInsights.segmentBreakdown.promoters}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={npsInsights.segmentBreakdown.promoters} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4, 
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#4caf50' }
                }} 
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, mt: 2 }}>
                <Typography variant="body2">Passives (7-8)</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {npsInsights.segmentBreakdown.passives}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={npsInsights.segmentBreakdown.passives} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4, 
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#ff9800' }
                }} 
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, mt: 2 }}>
                <Typography variant="body2">Detractors (0-6)</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {npsInsights.segmentBreakdown.detractors}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={npsInsights.segmentBreakdown.detractors} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4, 
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#f44336' }
                }} 
              />
            </Box>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Key Insights
            </Typography>
            <Box sx={{ mt: 2 }}>
              {npsInsights.insights && npsInsights.insights.length > 0 ? (
                <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  {npsInsights.insights.map((insight, index) => (
                    <Box key={index} sx={{ 
                      mb: 1,
                      position: 'relative',
                      border: '1px solid #2196f3',
                      borderRadius: 1,
                      backgroundColor: 'white',
                      p: 1.5,
                      '&:hover': {
                        boxShadow: 1
                      }
                    }}>
                      {/* Floating label on top border */}
                      <Typography variant="caption" sx={{
                        position: 'absolute',
                        top: -8,
                        left: 8,
                        backgroundColor: 'white',
                        px: 1,
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        color: 'info.main'
                      }}>
                        📊 NPS Insights
                      </Typography>
                      
                      {/* Main content */}
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        fontSize: '0.75rem',
                        lineHeight: 1.3
                      }}>
                        {insight}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No specific insights available at this time.
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default NPSInsightsTab;
