import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Button, 
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  alpha,
  Avatar
} from '@mui/material';
import { 
  ExpandMore, 
  ExpandLess, 
  Visibility, 
  TrendingUp,
  People,
  School,
  Warning,
  Error,
  Info,
  ArrowForward
} from '@mui/icons-material';
import { CustomerSuccessInsight } from '@/types/customerSuccess';

interface GroupedInsightCardProps {
  insights: CustomerSuccessInsight[];
  onViewDetails?: (insights: CustomerSuccessInsight[]) => void;
}

const GroupedInsightCard: React.FC<GroupedInsightCardProps> = ({
  insights,
  onViewDetails
}) => {
  const [expanded, setExpanded] = useState(false);
  
  if (insights.length === 0) return null;

  const firstInsight = insights[0];
  const severity = firstInsight.severity;
  const type = firstInsight.type;

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'red': 
        return {
          color: '#ef4444',
          bgColor: alpha('#ef4444', 0.1),
          icon: <Error sx={{ fontSize: 18 }} />,
          gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
        };
      case 'yellow': 
        return {
          color: '#f59e0b',
          bgColor: alpha('#f59e0b', 0.1),
          icon: <Warning sx={{ fontSize: 18 }} />,
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
        };
      case 'info': 
        return {
          color: '#3b82f6',
          bgColor: alpha('#3b82f6', 0.1),
          icon: <Info sx={{ fontSize: 18 }} />,
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
        };
      default: 
        return {
          color: '#6b7280',
          bgColor: alpha('#6b7280', 0.1),
          icon: <Info sx={{ fontSize: 18 }} />,
          gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
        };
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('trend') || type.includes('decline')) return <TrendingUp sx={{ fontSize: 20 }} />;
    if (type.includes('user') || type.includes('adoption')) return <People sx={{ fontSize: 20 }} />;
    if (type.includes('feature') || type.includes('discovery')) return <School sx={{ fontSize: 20 }} />;
    return <Visibility sx={{ fontSize: 20 }} />;
  };

  const formatTypeName = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActionButtons = (type: string) => {
    const buttons = [];
    
    if (type.includes('trend') || type.includes('decline')) {
      buttons.push(
        <Button 
          key="trend" 
          size="small" 
          startIcon={<TrendingUp />} 
          sx={{ 
            mr: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 2
          }}
        >
          View Trend
        </Button>
      );
    }
    
    if (type.includes('user') || type.includes('adoption')) {
      buttons.push(
        <Button 
          key="users" 
          size="small" 
          startIcon={<People />} 
          sx={{ 
            mr: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 2
          }}
        >
          Contact Users
        </Button>
      );
    }
    
    if (type.includes('feature') || type.includes('discovery')) {
      buttons.push(
        <Button 
          key="training" 
          size="small" 
          startIcon={<School />} 
          sx={{ 
            mr: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 2
          }}
        >
          Schedule Training
        </Button>
      );
    }
    
    buttons.push(
      <Button 
        key="details" 
        size="small" 
        variant="outlined"
        endIcon={<ArrowForward />}
        onClick={() => onViewDetails?.(insights)}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600,
          px: 2,
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2
          }
        }}
      >
        View Details
      </Button>
    );
    
    return buttons;
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
  const config = getSeverityConfig(severity);

  return (
    <Card sx={{ 
      mb: 3, 
      borderRadius: 3,
      border: 'none',
      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        '&::before': {
          opacity: 1
        }
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: config.gradient,
        opacity: 0.8,
        transition: 'opacity 0.3s ease'
      }
    }}>
      <CardContent sx={{ p: 3, position: 'relative' }}>
        {/* Background Pattern */}
        <Box sx={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: config.bgColor,
          opacity: 0.2
        }} />
        
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Avatar sx={{ 
              mr: 2, 
              backgroundColor: config.bgColor,
              color: config.color,
              width: 40,
              height: 40
            }}>
              {getTypeIcon(type)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                fontSize: '1.1rem',
                color: '#1f2937',
                mb: 0.5
              }}>
                {formatTypeName(type)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={severity.toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: config.color,
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
                <Typography variant="caption" sx={{ 
                  color: '#6b7280',
                  fontWeight: 500
                }}>
                  {insights.length} {insights.length === 1 ? 'insight' : 'insights'}
                </Typography>
              </Box>
            </Box>
          </Box>
          <IconButton 
            size="small" 
            onClick={() => setExpanded(!expanded)}
            sx={{ 
              ml: 1,
              backgroundColor: alpha(config.color, 0.1),
              color: config.color,
              '&:hover': {
                backgroundColor: alpha(config.color, 0.2)
              }
            }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        {/* Main Message */}
        <Typography variant="body1" sx={{ 
          mb: 2, 
          color: '#374151',
          fontWeight: 500,
          lineHeight: 1.6
        }}>
          {firstInsight.message}
        </Typography>

        {/* Affected Users Preview */}
        {affectedUsers.length > 0 && (
          <Box sx={{ 
            mb: 2, 
            p: 2, 
            backgroundColor: alpha(config.color, 0.05),
            borderRadius: 2,
            border: `1px solid ${alpha(config.color, 0.1)}`
          }}>
            <Typography variant="caption" sx={{ 
              display: 'block', 
              mb: 1,
              fontWeight: 600,
              color: config.color,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Affected Users ({affectedUsers.length})
            </Typography>
            <Typography variant="body2" sx={{ 
              fontSize: '0.9rem',
              color: '#4b5563'
            }}>
              {affectedUsers.slice(0, 3).join(', ')}
              {affectedUsers.length > 3 && ` and ${affectedUsers.length - 3} more...`}
            </Typography>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: expanded ? 2 : 0 }}>
          {getActionButtons(type)}
        </Box>

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Detailed Insights:
          </Typography>
          <List dense>
            {insights.map((insight, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {insight.message}
                    </Typography>
                  }
                  secondary={
                    insight.meta && Object.keys(insight.meta).length > 0 ? (
                      <Box sx={{ mt: 1 }}>
                        {Object.entries(insight.meta).map(([key, value]) => (
                          <Typography key={key} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            <strong>{key.replace(/_/g, ' ')}:</strong> {String(value)}
                          </Typography>
                        ))}
                      </Box>
                    ) : null
                  }
                />
              </ListItem>
            ))}
          </List>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default GroupedInsightCard;
