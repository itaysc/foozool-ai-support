import React from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { Close } from '@mui/icons-material';
import { InsightHeaderProps } from '../shared/types';
import { getSeverityColor, getSeverityBgColor } from '../shared/utils';
import { formatSeverity } from '../table/utils';

const InsightHeader: React.FC<InsightHeaderProps> = ({ insight, onClose }) => {
  if (!insight) return null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
      <Box sx={{ flex: 1, mr: 2 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.3 }}>
          {insight.message}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            label={formatSeverity(insight.severity || 'info')}
            size="small"
            sx={{
              backgroundColor: getSeverityBgColor(insight.severity || 'info'),
              color: getSeverityColor(insight.severity || 'info'),
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 24
            }}
          />
          <Chip
            label={insight.category?.replace('_', ' ').toUpperCase() || 'GENERAL'}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.75rem', height: 24 }}
          />
        </Box>
      </Box>
      <IconButton
        onClick={onClose}
        sx={{
          color: 'text.secondary',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <Close />
      </IconButton>
    </Box>
  );
};

export default InsightHeader;
