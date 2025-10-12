import React from 'react';
import { TableRow, TableCell, Typography, Chip, IconButton, Box } from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import AssigneeSelector from '../forms/AssigneeSelector';
import StatusSelector from '../filters/StatusSelector';
import { InsightTableRowProps } from './types';
import { 
  formatWeekYear, 
  getSeverityColor, 
  getSeverityBgColor,
  formatSeverity,
  formatInsightType
} from './utils';

const InsightTableRow: React.FC<InsightTableRowProps> = ({
  insight,
  index,
  onInsightSelect,
  onStatusChange,
  onAssigneeChange,
  users,
  loading,
  updating,
  hasPermission
}) => {
  const handleRowClick = () => {
    onInsightSelect(insight);
  };

  return (
    <TableRow
      hover
      onClick={handleRowClick}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
        animation: 'fadeIn 0.3s ease-in-out',
        animationDelay: `${index * 0.05}s`,
        animationFillMode: 'both'
      }}
    >
      {/* Chevron Column - Empty for single insights */}
      <TableCell sx={{ py: 1, width: 40, px: 1 }}>
        {/* Empty - no chevron for single insights */}
      </TableCell>

      {/* Insight ID */}
      <TableCell sx={{ py: 1 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600,
            fontSize: '0.8rem',
            color: 'text.secondary',
            fontFamily: 'monospace'
          }}
        >
          {insight.insightNumber || insight.id || insight.meta?.insightId || `IN${String(insight._id || '').slice(-6).padStart(6, '0')}`}
        </Typography>
      </TableCell>

      {/* Insight Type */}
      <TableCell sx={{ py: 1 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 500,
            fontSize: '0.875rem',
            lineHeight: 1.4
          }}
        >
          {formatInsightType(insight.type)}
        </Typography>
      </TableCell>

      {/* Summary */}
      <TableCell sx={{ py: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 400, 
              fontSize: '0.875rem',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {insight.message}
          </Typography>
        </Box>
      </TableCell>

      {/* Assignee */}
      <TableCell 
        sx={{ py: 1, textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <AssigneeSelector
          insight={insight}
          users={users}
          size="medium"
          onInsightUpdate={(insightId, updates) => {
            onAssigneeChange(insightId, updates.assignee);
          }}
        />
      </TableCell>

      {/* Severity */}
      <TableCell sx={{ py: 1, textAlign: 'center' }}>
        <Chip
          label={formatSeverity(insight.severity || 'info')}
          size="small"
          sx={{
            backgroundColor: getSeverityBgColor(insight.severity || 'info'),
            color: getSeverityColor(insight.severity || 'info'),
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 20,
            width: 80,
            minWidth: 80
          }}
        />
      </TableCell>

      {/* Status */}
      <TableCell 
        sx={{ py: 1, textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <StatusSelector
          status={insight.status || 'new'}
          onStatusChange={(status) => onStatusChange(insight.id || insight.meta?.insightId || '', status)}
          disabled={loading}
          hasPermission={hasPermission}
          updating={updating}
        />
      </TableCell>

      {/* Value */}
      <TableCell sx={{ py: 1, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
          1
        </Typography>
      </TableCell>

      {/* Created Date */}
      <TableCell sx={{ py: 1, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          {formatWeekYear(insight.createdAt || new Date().toISOString())}
        </Typography>
      </TableCell>
    </TableRow>
  );
};

export default InsightTableRow;
