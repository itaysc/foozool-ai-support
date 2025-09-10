import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Refresh, AutorenewOutlined } from '@mui/icons-material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  onRefresh?: () => void;
  actionButton?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  loading = false,
  onRefresh,
  actionButton
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h3" gutterBottom sx={{ 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {actionButton}
          {onRefresh && (
            <Tooltip title="Refresh Data">
              <IconButton 
                onClick={onRefresh} 
                disabled={loading}
                sx={{ 
                  backgroundColor: '#ffffff',
                  boxShadow: 2,
                  '&:hover': { backgroundColor: '#f5f5f5' }
                }}
              >
                {loading ? <AutorenewOutlined sx={{ animation: 'spin 1s linear infinite' }} /> : <Refresh />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default PageHeader;
