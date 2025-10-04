import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Button,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { 
  TrendingUp, 
  People, 
  School, 
  Download,
  Email,
  Schedule
} from '@mui/icons-material';
import Modal from '@/components/Modal';
import { CustomerSuccessInsight } from '@/types/customerSuccess';

interface InsightDrillDownModalProps {
  open: boolean;
  onClose: () => void;
  insights: CustomerSuccessInsight[];
}

const InsightDrillDownModal: React.FC<InsightDrillDownModalProps> = ({
  open,
  onClose,
  insights
}) => {
  if (insights.length === 0) return null;

  const firstInsight = insights[0];
  const type = firstInsight.type;

  const formatTypeName = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'red': return '#f44336';
      case 'yellow': return '#ff9800';
      case 'info': return '#2196f3';
      default: return '#9e9e9e';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'red': return '🔴';
      case 'yellow': return '🟡';
      case 'info': return '🔵';
      default: return '⚪';
    }
  };

  const getAffectedUsers = () => {
    const users = new Set<string>();
    insights.forEach(insight => {
      if (insight.meta?.decliningUserIds) {
        insight.meta.decliningUserIds.forEach((id: string) => users.add(id));
      }
      if (insight.meta?.anomalousUserIds) {
        insight.meta.anomalousUserIds.forEach((id: string) => users.add(id));
      }
      if (insight.meta?.powerUserIds) {
        insight.meta.powerUserIds.forEach((id: string) => users.add(id));
      }
    });
    return Array.from(users);
  };

  const affectedUsers = getAffectedUsers();

  const getKeyMetrics = () => {
    const metrics = [];
    
    if (type.includes('trend') || type.includes('decline')) {
      const totalDeclining = insights.reduce((sum, insight) => 
        sum + (insight.meta?.decliningUserCount || 0), 0);
      metrics.push({ label: 'Users at Risk', value: totalDeclining, icon: <People /> });
    }
    
    if (type.includes('feature') || type.includes('discovery')) {
      const avgUndiscovered = insights.reduce((sum, insight) => 
        sum + (parseFloat(insight.meta?.avgUndiscoveredFeatures || '0')), 0) / insights.length;
      metrics.push({ label: 'Avg Undiscovered Features', value: avgUndiscovered.toFixed(1), icon: <School /> });
    }
    
    if (type.includes('pattern') || type.includes('anomaly')) {
      const totalAnomalous = insights.reduce((sum, insight) => 
        sum + (insight.meta?.anomalousUserCount || 0), 0);
      metrics.push({ label: 'Users with Anomalies', value: totalAnomalous, icon: <TrendingUp /> });
    }
    
    return metrics;
  };

  const keyMetrics = getKeyMetrics();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${getSeverityIcon(firstInsight.severity)} ${formatTypeName(type)} - Detailed Analysis`}
      maxWidth="lg"
    >
      <Box>
        {/* Key Metrics */}
        {keyMetrics.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {keyMetrics.map((metric, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ textAlign: 'center' }}>
                  <CardContent>
                    <Box sx={{ color: getSeverityColor(firstInsight.severity), mb: 1 }}>
                      {metric.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {metric.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Affected Users */}
        {affectedUsers.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Affected Users ({affectedUsers.length})
            </Typography>
            <Card>
              <CardContent>
                <Grid container spacing={1}>
                  {affectedUsers.map((userId, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Box sx={{ 
                        p: 1, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1,
                        backgroundColor: '#f9f9f9'
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {userId}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Detailed Insights */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Detailed Insights ({insights.length})
          </Typography>
          <List>
            {insights.map((insight, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label={insight.severity.toUpperCase()}
                          size="small"
                          sx={{ 
                            mr: 1,
                            backgroundColor: getSeverityColor(insight.severity),
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {formatTypeName(insight.type)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {insight.message}
                        </Typography>
                        {insight.meta && Object.keys(insight.meta).length > 0 && (
                          <Box sx={{ 
                            backgroundColor: '#f5f5f5', 
                            p: 1, 
                            borderRadius: 1,
                            mt: 1
                          }}>
                            {Object.entries(insight.meta).map(([key, value]) => (
                              <Typography key={key} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                <strong>{key.replace(/_/g, ' ')}:</strong> {String(value)}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < insights.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
          {type.includes('trend') || type.includes('decline') ? (
            <Button variant="contained" startIcon={<TrendingUp />}>
              View Activity Trends
            </Button>
          ) : null}
          
          {type.includes('user') || type.includes('adoption') ? (
            <Button variant="contained" startIcon={<Email />}>
              Contact Affected Users
            </Button>
          ) : null}
          
          {type.includes('feature') || type.includes('discovery') ? (
            <Button variant="contained" startIcon={<School />}>
              Schedule Training Session
            </Button>
          ) : null}
          
          <Button variant="outlined" startIcon={<Download />}>
            Export Data
          </Button>
          
          <Button variant="outlined" startIcon={<Schedule />}>
            Set Alert
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default InsightDrillDownModal;
