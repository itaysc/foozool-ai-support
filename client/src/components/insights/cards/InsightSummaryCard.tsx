import React from 'react';
import { Card, CardContent, Typography, Box, Chip, alpha } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat, Warning, Info, Error } from '@mui/icons-material';

interface InsightSummaryCardProps {
  title: string;
  count: number;
  severity: 'red' | 'yellow' | 'info';
  trend?: number;
  subtitle?: string;
  onClick?: () => void;
  isSelected?: boolean;
  isPartiallySelected?: boolean;
}

const InsightSummaryCard: React.FC<InsightSummaryCardProps> = ({
  title,
  count,
  severity,
  trend,
  subtitle,
  onClick,
  isSelected = false,
  isPartiallySelected = false
}) => {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'red': 
        return {
          color: '#ef4444',
          bgColor: alpha('#ef4444', 0.1),
          icon: <Error sx={{ fontSize: 20 }} />,
          gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
        };
      case 'yellow': 
        return {
          color: '#f59e0b',
          bgColor: alpha('#f59e0b', 0.1),
          icon: <Warning sx={{ fontSize: 20 }} />,
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
        };
      case 'info': 
        return {
          color: '#3b82f6',
          bgColor: alpha('#3b82f6', 0.1),
          icon: <Info sx={{ fontSize: 20 }} />,
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
        };
      default: 
        return {
          color: '#6b7280',
          bgColor: alpha('#6b7280', 0.1),
          icon: <Info sx={{ fontSize: 20 }} />,
          gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
        };
    }
  };

  const config = getSeverityConfig(severity);
  const isActive = isSelected || isPartiallySelected;

  const getTrendIcon = (trendValue: number) => {
    if (trendValue > 0) return <TrendingUp sx={{ fontSize: 16, color: '#ef4444' }} />;
    if (trendValue < 0) return <TrendingDown sx={{ fontSize: 16, color: '#10b981' }} />;
    return <TrendingFlat sx={{ fontSize: 16, color: '#6b7280' }} />;
  };

  return (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        borderRadius: 2,
        border: isActive ? `2px solid ${config.color}` : 'none',
        background: isActive 
          ? `linear-gradient(145deg, ${alpha(config.color, isSelected ? 0.05 : 0.03)} 0%, ${alpha(config.color, isSelected ? 0.02 : 0.01)} 100%)`
          : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: isActive 
          ? `0 4px 6px -1px ${alpha(config.color, isSelected ? 0.2 : 0.1)}, 0 2px 4px -1px ${alpha(config.color, isSelected ? 0.1 : 0.05)}`
          : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
        '&:hover': onClick ? {
          transform: isActive ? 'translateY(-1px)' : 'translateY(-2px)',
          boxShadow: isActive 
            ? `0 4px 6px -1px ${alpha(config.color, isSelected ? 0.2 : 0.1)}, 0 2px 4px -1px ${alpha(config.color, isSelected ? 0.1 : 0.05)}`
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          '&::before': {
            opacity: 1
          }
        } : {},
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: isActive ? '4px' : '3px',
          background: config.gradient,
          opacity: isActive ? (isSelected ? 1 : 0.6) : 0.8,
          transition: 'opacity 0.2s ease, height 0.2s ease'
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 0.75, position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Background Pattern */}
        <Box sx={{
          position: 'absolute',
          top: -6,
          right: -6,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: config.bgColor,
          opacity: 0.3
        }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ 
              p: 0.25, 
              borderRadius: 0.5, 
              backgroundColor: config.bgColor,
              color: config.color,
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {React.cloneElement(config.icon, { sx: { fontSize: 10 } })}
            </Box>
            <Typography variant="subtitle2" sx={{ 
              fontWeight: 600, 
              fontSize: '0.7rem',
              color: '#374151'
            }}>
              {title}
            </Typography>
          </Box>
          
          {trend !== undefined && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              px: 0.5,
              py: 0.125,
              borderRadius: 0.5,
              backgroundColor: trend > 0 ? alpha('#ef4444', 0.1) : trend < 0 ? alpha('#10b981', 0.1) : alpha('#6b7280', 0.1)
            }}>
              {getTrendIcon(trend)}
              <Typography 
                variant="caption" 
                sx={{ 
                  ml: 0.25, 
                  fontWeight: 600,
                  fontSize: '0.55rem',
                  color: trend > 0 ? '#ef4444' : trend < 0 ? '#10b981' : '#6b7280'
                }}
              >
                {trend > 0 ? '+' : ''}{trend}%
              </Typography>
            </Box>
          )}
        </Box>
        
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            color: config.color, 
            mb: 0.125,
            fontSize: '1.25rem',
            lineHeight: 1
          }}>
            {count}
          </Typography>
          
          {subtitle && (
            <Typography variant="caption" sx={{ 
              fontSize: '0.6rem',
              color: '#6b7280',
              fontWeight: 500
            }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default InsightSummaryCard;
