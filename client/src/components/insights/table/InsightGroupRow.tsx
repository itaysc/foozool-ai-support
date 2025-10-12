import React from 'react';
import { TableRow, TableCell, Typography, Chip, IconButton, Box, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess, ChevronRight } from '@mui/icons-material';
import { InsightGroupRowProps } from './types';
import { 
  getSeverityColor, 
  getSeverityBgColor, 
  formatInsightType,
  formatSeverity,
  formatWeekYear
} from './utils';
import AssigneeSelector from '../forms/AssigneeSelector';
import StatusSelector from '../filters/StatusSelector';

const InsightGroupRow: React.FC<InsightGroupRowProps> = ({
  group,
  expandedGroups,
  onToggleExpand,
  onInsightSelect,
  onStatusChange,
  onAssigneeChange,
  users,
  loading,
  updatingInsights,
  hasPermission
}) => {
  const isExpanded = expandedGroups.has(group.id);

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(group.id);
  };

  const handleRowClick = () => {
    if (group.children.length === 1) {
      onInsightSelect(group.children[0]);
    }
  };

  return (
    <>
      {/* Group Header Row */}
      <TableRow
        hover
        onClick={group.hasChildren ? handleToggleExpand : handleRowClick}
        sx={{
          cursor: group.hasChildren || group.children.length === 1 ? 'pointer' : 'default',
          backgroundColor: isExpanded ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
          '&:hover': {
            backgroundColor: group.hasChildren || group.children.length === 1 ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.02)',
          },
          animation: 'fadeIn 0.3s ease-in-out',
          animationFillMode: 'both'
        }}
      >
        {/* Chevron Column */}
        <TableCell sx={{ py: 1, width: 40, px: 1 }}>
          {group.hasChildren && (
            <IconButton
              size="small"
              sx={{ 
                p: 0.5,
                color: 'text.secondary',
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              <ExpandMore sx={{ fontSize: 16 }} />
            </IconButton>
          )}
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
            {group.children.length === 1 ? 
              (group.children[0].insightNumber || group.children[0].id || group.children[0].meta?.insightId || '') :
              ''
            }
          </Typography>
        </TableCell>

        {/* Insight Type */}
        <TableCell sx={{ py: 1 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: group.hasChildren ? 600 : 500,
              fontSize: '0.875rem',
              lineHeight: 1.4
            }}
          >
            {group.hasChildren ? `${formatInsightType(group.type)} (${group.count})` : formatInsightType(group.type)}
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
              {group.message}
            </Typography>
          </Box>
        </TableCell>

        {/* Assignee - Show for single item or summary for group */}
        <TableCell 
          sx={{ py: 1, textAlign: 'center' }}
          onClick={(e) => e.stopPropagation()}
        >
          {group.children.length === 1 ? (
            <AssigneeSelector
              insight={group.children[0]}
              users={users}
              size="medium"
              onInsightUpdate={(insightId, updates) => {
                onAssigneeChange(insightId, updates.assignee);
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Multiple
            </Typography>
          )}
        </TableCell>

        {/* Severity */}
        <TableCell sx={{ py: 1, textAlign: 'center' }}>
          <Chip
            label={formatSeverity(group.severity)}
            size="small"
            sx={{
              backgroundColor: getSeverityBgColor(group.severity),
              color: getSeverityColor(group.severity),
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 20,
              width: 80,
              minWidth: 80
            }}
          />
        </TableCell>

        {/* Status - Show for single item or summary for group */}
        <TableCell 
          sx={{ py: 1, textAlign: 'center' }}
          onClick={(e) => e.stopPropagation()}
        >
          {group.children.length === 1 ? (
            <StatusSelector
              status={group.children[0].status || 'new'}
              onStatusChange={(status) => onStatusChange(group.children[0].id || group.children[0].meta?.insightId || '', status)}
              disabled={loading}
              hasPermission={hasPermission}
              updating={updatingInsights.has(group.children[0].id || group.children[0].meta?.insightId || '')}
            />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Mixed
            </Typography>
          )}
        </TableCell>

        {/* Value */}
        <TableCell sx={{ py: 1, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
            {group.children.length}
          </Typography>
        </TableCell>


        {/* Created Date */}
        <TableCell sx={{ py: 1, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            {group.children.length === 1 
              ? formatWeekYear(group.children[0].createdAt || new Date().toISOString())
              : 'Multiple'
            }
          </Typography>
        </TableCell>
      </TableRow>

      {/* Expanded Children Rows */}
      {group.hasChildren && isExpanded && (
        group.children.map((child, index) => (
          <TableRow
            key={child.id || child.meta?.insightId || index}
            hover
            onClick={() => onInsightSelect(child)}
            sx={{
              cursor: 'pointer',
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              animation: 'fadeIn 0.3s ease-in-out',
              animationDelay: `${index * 0.05}s`,
              animationFillMode: 'both'
            }}
          >
            {/* Chevron Column - Empty for child rows */}
            <TableCell sx={{ py: 0.5, width: 40, px: 1, pl: 4 }}>
              {/* Empty - no chevron for child rows */}
            </TableCell>

            {/* Insight ID */}
            <TableCell sx={{ py: 0.5 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  fontFamily: 'monospace'
                }}
              >
                {child.insightNumber || child.id || child.meta?.insightId || ''}
              </Typography>
            </TableCell>

            {/* Insight Type */}
            <TableCell sx={{ py: 0.5 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  lineHeight: 1.4
                }}
              >
                {formatInsightType(child.type)}
              </Typography>
            </TableCell>

            {/* Summary */}
            <TableCell sx={{ py: 0.5 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 400, 
                    fontSize: '0.8rem',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {child.message}
                </Typography>
              </Box>
            </TableCell>

            {/* Assignee */}
            <TableCell 
              sx={{ py: 0.5, textAlign: 'center' }}
              onClick={(e) => e.stopPropagation()}
            >
              <AssigneeSelector
                insight={child}
                users={users}
                size="medium"
                onInsightUpdate={(insightId, updates) => {
                  onAssigneeChange(insightId, updates.assignee);
                }}
              />
            </TableCell>

            {/* Severity */}
            <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
              <Chip
                label={formatSeverity(child.severity || 'info')}
                size="small"
                sx={{
                  backgroundColor: getSeverityBgColor(child.severity || 'info'),
                  color: getSeverityColor(child.severity || 'info'),
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 18,
                  width: 70,
                  minWidth: 70
                }}
              />
            </TableCell>

            {/* Status */}
            <TableCell 
              sx={{ py: 0.5, textAlign: 'center' }}
              onClick={(e) => e.stopPropagation()}
            >
              <StatusSelector
                status={child.status || 'new'}
                onStatusChange={(status) => onStatusChange(child.id || child.meta?.insightId || `${group.id}-${index}`, status)}
                disabled={loading}
                hasPermission={hasPermission}
                updating={updatingInsights.has(child.id || child.meta?.insightId || `${group.id}-${index}`)}
              />
            </TableCell>

            {/* Value */}
            <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                1
              </Typography>
            </TableCell>

            {/* Period */}
            <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                {formatWeekYear(child.createdAt || new Date().toISOString())}
              </Typography>
            </TableCell>
          </TableRow>
        ))
      )}
    </>
  );
};

export default InsightGroupRow;
