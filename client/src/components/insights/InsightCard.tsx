import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';

interface InsightCardProps {
  insight: {
    id: string;
    title: string;
    description: string;
    severity: 'High' | 'Medium' | 'Low';
    category: string;
    impact?: string;
    recommendation?: string;
  };
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'High': return '🔴';
      case 'Medium': return '🟡';
      case 'Low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <Card sx={{ mb: 2, borderLeft: `4px solid ${getSeverityColor(insight.severity) === 'error' ? '#f44336' : getSeverityColor(insight.severity) === 'warning' ? '#ff9800' : '#4caf50'}` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
            {insight.title}
          </Typography>
          <Chip 
            label={`${getSeverityIcon(insight.severity)} ${insight.severity}`}
            color={getSeverityColor(insight.severity) as any}
            size="small"
            sx={{ ml: 1 }}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {insight.description}
        </Typography>
        
        {insight.impact && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
              Impact:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {insight.impact}
            </Typography>
          </Box>
        )}
        
        {insight.recommendation && (
          <Box sx={{ 
            backgroundColor: 'grey.50', 
            p: 2, 
            borderRadius: 1, 
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <InfoOutlined sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                Recommendation:
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {insight.recommendation}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default InsightCard;
