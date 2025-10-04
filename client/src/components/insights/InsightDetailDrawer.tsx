import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  alpha,
  Paper,
  Slide
} from '@mui/material';
import { 
  Close, 
  TrendingUp, 
  People, 
  School, 
  Email,
  Schedule,
  Download,
  Person
} from '@mui/icons-material';
import { CustomerSuccessInsight } from '@/types/customerSuccess';

interface InsightDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  insight: CustomerSuccessInsight | null;
}

const InsightDetailDrawer: React.FC<InsightDetailDrawerProps> = ({
  open,
  onClose,
  insight
}) => {
  if (!insight) return null;

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'red': 
        return {
          color: '#ef4444',
          bgColor: alpha('#ef4444', 0.1),
          label: 'Critical'
        };
      case 'yellow': 
        return {
          color: '#f59e0b',
          bgColor: alpha('#f59e0b', 0.1),
          label: 'Warning'
        };
      case 'info': 
        return {
          color: '#3b82f6',
          bgColor: alpha('#3b82f6', 0.1),
          label: 'Info'
        };
      default: 
        return {
          color: '#6b7280',
          bgColor: alpha('#6b7280', 0.1),
          label: 'Unknown'
        };
    }
  };

  const formatTypeName = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getAffectedUsers = () => {
    const users = new Set<string>();
    if (insight.meta?.decliningUserIds) {
      insight.meta.decliningUserIds.forEach((id: string) => users.add(id));
    }
    if (insight.meta?.anomalousUserIds) {
      insight.meta.anomalousUserIds.forEach((id: string) => users.add(id));
    }
    if (insight.meta?.powerUserIds) {
      insight.meta.powerUserIds.forEach((id: string) => users.add(id));
    }
    return Array.from(users);
  };

  const affectedUsers = getAffectedUsers();
  const config = getSeverityConfig(insight.severity);

  const getActionButtons = () => {
    const buttons = [];
    
    if (insight.type.includes('trend') || insight.type.includes('decline')) {
      buttons.push(
        <Button 
          key="trend" 
          variant="contained" 
          startIcon={<TrendingUp />} 
          sx={{ 
            mr: 1, 
            mb: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          View Activity Trends
        </Button>
      );
    }
    
    if (insight.type.includes('user') || insight.type.includes('adoption')) {
      buttons.push(
        <Button 
          key="users" 
          variant="contained" 
          startIcon={<Email />} 
          sx={{ 
            mr: 1, 
            mb: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Contact Affected Users
        </Button>
      );
    }
    
    if (insight.type.includes('feature') || insight.type.includes('discovery')) {
      buttons.push(
        <Button 
          key="training" 
          variant="contained" 
          startIcon={<School />} 
          sx={{ 
            mr: 1, 
            mb: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Schedule Training Session
        </Button>
      );
    }
    
    buttons.push(
      <Button 
        key="export" 
        variant="outlined" 
        startIcon={<Download />} 
        sx={{ 
          mr: 1, 
          mb: 1,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600
        }}
      >
        Export Data
      </Button>
    );
    
    buttons.push(
      <Button 
        key="alert" 
        variant="outlined" 
        startIcon={<Schedule />} 
        sx={{ 
          mr: 1, 
          mb: 1,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600
        }}
      >
        Set Alert
      </Button>
    );
    
    return buttons;
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      transitionDuration={300}
      sx={{
        '& .MuiDrawer-paper': {
          width: 480,
          maxWidth: '90vw',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important'
        },
        '& .MuiBackdrop-root': {
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important'
        }
      }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {formatTypeName(insight.type)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={config.label}
                sx={{
                  backgroundColor: config.color,
                  color: 'white',
                  fontWeight: 600
                }}
              />
              <Avatar sx={{ width: 32, height: 32 }}>
                <Person sx={{ fontSize: 18 }} />
              </Avatar>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {/* Insight Description */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: config.color }}>
              INSIGHT
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              {insight.message}
            </Typography>
          </Paper>

          {/* Recommended Action */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2, backgroundColor: alpha('#10b981', 0.05) }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#10b981' }}>
              RECOMMENDED ACTION
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              {insight.type.includes('trend') || insight.type.includes('decline') 
                ? 'Monitor user activity patterns and reach out to users showing declining engagement. Consider offering additional training or support.'
                : insight.type.includes('feature') || insight.type.includes('discovery')
                ? 'Schedule training sessions to help users discover and adopt key features they haven\'t used yet.'
                : 'Review the insight details and take appropriate action based on the specific situation.'
              }
            </Typography>
          </Paper>

          {/* Properties */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
              PROPERTIES
            </Typography>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Insight Domain"
                  secondary={formatTypeName(insight.type)}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                  secondaryTypographyProps={{ fontSize: '0.9rem' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Category"
                  secondary={insight.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                  secondaryTypographyProps={{ fontSize: '0.9rem' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Severity"
                  secondary={config.label}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                  secondaryTypographyProps={{ fontSize: '0.9rem' }}
                />
              </ListItem>
              {affectedUsers.length > 0 && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Affected Users"
                    secondary={affectedUsers.length}
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.9rem' }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>

          {/* Affected Users */}
          {affectedUsers.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                AFFECTED USERS ({affectedUsers.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {affectedUsers.map((userId, index) => (
                  <Chip 
                    key={index}
                    label={userId}
                    size="small"
                    sx={{ 
                      backgroundColor: alpha(config.color, 0.1),
                      color: config.color,
                      fontWeight: 500
                    }}
                  />
                ))}
              </Box>
            </Paper>
          )}

          {/* Metadata */}
          {insight.meta && Object.keys(insight.meta).length > 0 && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                DETAILED METADATA
              </Typography>
              <List dense>
                {Object.entries(insight.meta).map(([key, value]) => (
                  <ListItem key={key} sx={{ px: 0 }}>
                    <ListItemText 
                      primary={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      secondary={String(value)}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                      secondaryTypographyProps={{ fontSize: '0.9rem' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>

        {/* Comments Section */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
            COMMENTS
          </Typography>
          <Box sx={{ 
            minHeight: 120, 
            border: '1px solid #e5e7eb', 
            borderRadius: 1, 
            p: 2,
            backgroundColor: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              No comments yet. Add a comment to track progress and discussions.
            </Typography>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<Email />}
              sx={{ fontSize: '0.8rem' }}
            >
              Add Comment
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              sx={{ fontSize: '0.8rem' }}
            >
              View All
            </Button>
          </Box>
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {getActionButtons()}
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default InsightDetailDrawer;
