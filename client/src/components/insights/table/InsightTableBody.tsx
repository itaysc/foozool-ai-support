import React from 'react';
import { TableBody } from '@mui/material';
import { InsightTableBodyProps } from './types';
import InsightGroupRow from './InsightGroupRow';

const InsightTableBody: React.FC<InsightTableBodyProps> = ({
  groupedInsights,
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
  return (
    <TableBody>
      {groupedInsights.map((group) => (
        <InsightGroupRow
          key={group.id}
          group={group}
          expandedGroups={expandedGroups}
          onToggleExpand={onToggleExpand}
          onInsightSelect={onInsightSelect}
          onStatusChange={onStatusChange}
          onAssigneeChange={onAssigneeChange}
          users={users}
          loading={loading}
          updatingInsights={updatingInsights}
          hasPermission={hasPermission}
        />
      ))}
    </TableBody>
  );
};

export default InsightTableBody;
