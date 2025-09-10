import React from 'react';
import { Box, Typography, Alert, Card, CardContent, Chip, Paper } from '@mui/material';
import { Insight, InsightSummary } from '@/types/insight';
import MetricCard from '@/components/insights/MetricCard';
import InsightCard from '@/components/insights/InsightCard';
import PageHeader from '@/components/insights/PageHeader';
import { BugReport, Speed, Timeline } from '@mui/icons-material';

interface TicketInsightsTabProps {
  insights: Insight[];
  insightSummary: InsightSummary | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const TicketInsightsTab: React.FC<TicketInsightsTabProps> = ({
  insights,
  insightSummary,
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

  return (
    <Box>
      <PageHeader
        title="Ticket Insights"
        subtitle="AI-powered analysis of support tickets and customer issues"
        loading={loading}
        onRefresh={onRefresh}
      />

      {insightSummary && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
          gap: 3, 
          mb: 4 
        }}>
          <MetricCard
            title="Total Insights"
            value={insightSummary.totalInsights}
            icon={<BugReport />}
            color="primary"
          />
          <MetricCard
            title="Total Ticket Volume"
            value={insightSummary.totalTicketVolume}
            icon={<Speed />}
            color="info"
          />
          <MetricCard
            title="Avg Growth Rate"
            value={`${insightSummary.avgGrowthRate.toFixed(1)}%`}
            icon={<Timeline />}
            color="success"
          />
          <MetricCard
            title="Max Growth Rate"
            value={`${insightSummary.maxGrowthRate.toFixed(1)}%`}
            icon={<BugReport />}
            color="error"
          />
        </Box>
      )}

      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Key Insights
        </Typography>
        
        {insights.length === 0 ? (
          <Alert severity="info">
            No insights available. Generate insights to see AI-powered analysis of your support tickets.
          </Alert>
        ) : (
          <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
            {insights.map((insight, index) => (
              <Box key={insight.clusterId} sx={{ 
                mb: 1,
                position: 'relative',
                border: `1px solid ${insight.growthRate > 0 ? '#f44336' : '#4caf50'}`,
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
                  color: 'primary.main'
                }}>
                  Issue Cluster #{index + 1}
                </Typography>
                
                {/* Main content row */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    fontSize: '0.75rem',
                    flex: 1
                  }}>
                    {insight.issueDescription}
                  </Typography>
                  <Chip 
                    label={`${insight.growthRate > 0 ? '+' : ''}${insight.growthRate.toFixed(1)}%`}
                    color={insight.growthRate > 0 ? 'error' : 'success'}
                    size="small"
                    sx={{ ml: 1, fontSize: '0.65rem', height: '18px' }}
                  />
                </Box>
                
                {/* Additional details */}
                <Box sx={{ 
                  backgroundColor: 'grey.50', 
                  p: 0.75, 
                  borderRadius: 0.5, 
                  border: '1px solid',
                  borderColor: 'grey.200',
                  mt: 0.5
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ 
                    fontSize: '0.65rem',
                    display: 'block'
                  }}>
                    <strong>Volume:</strong> {insight.ticketVolume} tickets
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ 
                    fontSize: '0.65rem',
                    display: 'block'
                  }}>
                    <strong>First Detected:</strong> {new Date(insight.firstDetectedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default TicketInsightsTab;
