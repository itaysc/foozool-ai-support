import React from 'react';
import { Box, Typography } from '@mui/material';
import { InsightMetaInfoProps } from '../shared/types';
import AssigneeSelector from '../forms/AssigneeSelector';
import StatusSelector from '../filters/StatusSelector';

const InsightMetaInfo: React.FC<InsightMetaInfoProps> = ({
  insight,
  onInsightUpdate,
  users,
  updating,
  setUpdating
}) => {
  if (!insight) return null;

  const handleStatusChange = async (newStatus: string) => {
    if (!insight?.id || !onInsightUpdate) return;
    
    setUpdating(true);
    try {
      await onInsightUpdate(insight.id, { status: newStatus as any });
    } catch (error) {
      console.error('Failed to update insight status:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Helper function to format date as yyyy-mm-dd
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
        Insight Details
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        {/* Assignee */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
            Assignee:
          </Typography>
          <AssigneeSelector
            insight={insight}
            users={users}
            onInsightUpdate={onInsightUpdate}
          />
        </Box>

        {/* Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
            Status:
          </Typography>
          <StatusSelector
            status={insight.status || 'new'}
            onStatusChange={handleStatusChange}
            disabled={false}
            hasPermission={true}
            updating={updating}
          />
        </Box>

        {/* Created Date */}
        {insight.createdAt && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
              Created:
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {formatDate(insight.createdAt)}
            </Typography>
          </Box>
        )}

        {/* Updated Date */}
        {insight.updatedAt && insight.updatedAt !== insight.createdAt && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
              Updated:
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {formatDate(insight.updatedAt)}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default InsightMetaInfo;
