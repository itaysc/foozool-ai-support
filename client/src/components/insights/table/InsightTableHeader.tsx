import React from 'react';
import { TableHead, TableRow, TableCell, Typography, Box, IconButton } from '@mui/material';
import { ArrowUpward, ArrowDownward, UnfoldMore } from '@mui/icons-material';
import { InsightTableHeaderProps, SortField } from './types';

const InsightTableHeader: React.FC<InsightTableHeaderProps> = ({ sortConfig, onSort }) => {
  const getSortIcon = (field: SortField) => {
    if (!sortConfig || sortConfig.field !== field) {
      return <UnfoldMore sx={{ fontSize: 16, opacity: 0.5 }} />;
    }
    return sortConfig.order === 'asc' 
      ? <ArrowUpward sx={{ fontSize: 16 }} />
      : <ArrowDownward sx={{ fontSize: 16 }} />;
  };

  const handleSort = (field: SortField) => {
    if (!onSort) return;
    onSort(field);
  };

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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              Assignee
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => handleSort('assignee')}
              sx={{ 
                p: 0.25, 
                color: sortConfig?.field === 'assignee' ? 'primary.main' : 'text.secondary',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              {getSortIcon('assignee')}
            </IconButton>
          </Box>
        </TableCell>
        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', textAlign: 'center', backgroundColor: '#f0f8ff', py: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              Severity
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => handleSort('severity')}
              sx={{ 
                p: 0.25, 
                color: sortConfig?.field === 'severity' ? 'primary.main' : 'text.secondary',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              {getSortIcon('severity')}
            </IconButton>
          </Box>
        </TableCell>
        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', textAlign: 'center', backgroundColor: '#f0f8ff', py: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              Status
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => handleSort('status')}
              sx={{ 
                p: 0.25, 
                color: sortConfig?.field === 'status' ? 'primary.main' : 'text.secondary',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              {getSortIcon('status')}
            </IconButton>
          </Box>
        </TableCell>
        <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', textAlign: 'center', backgroundColor: '#f0f8ff', py: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              Period
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => handleSort('period')}
              sx={{ 
                p: 0.25, 
                color: sortConfig?.field === 'period' ? 'primary.main' : 'text.secondary',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              {getSortIcon('period')}
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
    </TableHead>
  );
};

export default InsightTableHeader;
