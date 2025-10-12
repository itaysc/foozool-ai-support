import React from 'react';
import { TableHead, TableRow, TableCell, Typography, Box } from '@mui/material';
import { InsightTableHeaderProps } from './types';

const InsightTableHeader: React.FC<InsightTableHeaderProps> = () => {
  return (
    <TableHead>
      <TableRow sx={{ backgroundColor: '#f0f8ff', height: 'auto' }}>
        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', width: 40, px: 1, backgroundColor: '#f0f8ff', py: 0.5 }}>
          {/* Chevron column header - empty */}
        </TableCell>
        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', backgroundColor: '#f0f8ff', py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            ID
          </Typography>
        </TableCell>
        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', backgroundColor: '#f0f8ff', py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            Customer
          </Typography>
        </TableCell>
        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', backgroundColor: '#f0f8ff', py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            Insight
          </Typography>
        </TableCell>
        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', backgroundColor: '#f0f8ff', py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            Summary
          </Typography>
        </TableCell>
        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', textAlign: 'center', backgroundColor: '#f0f8ff', py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            Assignee
          </Typography>
        </TableCell>
        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', textAlign: 'center', backgroundColor: '#f0f8ff', py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            Severity
          </Typography>
        </TableCell>
        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', textAlign: 'center', backgroundColor: '#f0f8ff', py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            Status
          </Typography>
        </TableCell>
        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', textAlign: 'center', backgroundColor: '#f0f8ff', py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            Period
          </Typography>
        </TableCell>
      </TableRow>
    </TableHead>
  );
};

export default InsightTableHeader;
