import React from 'react';
import { Box, Button, Chip } from '@mui/material';
import { 
  Download, 
  Check, 
  PlayArrow, 
  CheckCircle, 
  Cancel, 
  Refresh 
} from '@mui/icons-material';
import { InsightComponentProps } from '../shared/types';

const InsightActions: React.FC<InsightComponentProps> = ({ insight }) => {
  if (!insight) return null;

  const getActionButtons = () => {
    const buttons = [];

    // Resolve button
    if (insight.status !== 'resolved' && insight.status !== 'closed') {
      buttons.push(
        <Button
          key="resolve"
          variant="contained"
          size="small"
          startIcon={<Check />}
          sx={{
            backgroundColor: '#059669',
            color: 'white',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#047857',
            },
          }}
        >
          Mark as Resolved
        </Button>
      );
    }

    // Download/Export button
    buttons.push(
      <Button
        key="download"
        variant="outlined"
        size="small"
        startIcon={<Download />}
        sx={{ textTransform: 'none' }}
      >
        Export
      </Button>
    );

    // Refresh button
    buttons.push(
      <Button
        key="refresh"
        variant="outlined"
        size="small"
        startIcon={<Refresh />}
        sx={{ textTransform: 'none' }}
      >
        Refresh
      </Button>
    );

    // Status-specific buttons
    if (insight.status === 'new') {
      buttons.push(
        <Button
          key="start"
          variant="contained"
          size="small"
          startIcon={<PlayArrow />}
          sx={{
            backgroundColor: '#d97706',
            color: 'white',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#b45309',
            },
          }}
        >
          Start Investigation
        </Button>
      );
    }

    if (insight.status === 'in_progress') {
      buttons.push(
        <Button
          key="complete"
          variant="contained"
          size="small"
          startIcon={<CheckCircle />}
          sx={{
            backgroundColor: '#059669',
            color: 'white',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#047857',
            },
          }}
        >
          Complete
        </Button>
      );
    }

    // Priority indicator
    if (insight.severity === 'red') {
      buttons.push(
        <Chip
          key="priority"
          label="HIGH PRIORITY"
          size="small"
          sx={{
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
      );
    }

    return buttons;
  };

  return (
    <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {getActionButtons()}
      </Box>
    </Box>
  );
};

export default InsightActions;
