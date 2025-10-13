import { CustomerSuccessInsight } from '@/types/customerSuccess';
import { GroupedInsight, SortConfig } from './types';

// Get affected users from insight meta
export const getAffectedUsers = (insight: CustomerSuccessInsight): string[] => {
  if (insight.meta?.affectedUsers && Array.isArray(insight.meta.affectedUsers)) {
    return insight.meta.affectedUsers;
  }
  
  if (insight.meta?.affectedCustomers && Array.isArray(insight.meta.affectedCustomers)) {
    return insight.meta.affectedCustomers;
  }
  
  return [];
};

// Format date to week-year format
export const formatWeekYear = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year} W${week.toString().padStart(2, '0')}`;
};

// Get severity color
export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'red': return '#dc2626';
    case 'yellow': return '#d97706';
    case 'info': return '#0891b2';
    default: return '#6b7280';
  }
};

// Get severity background color
export const getSeverityBgColor = (severity: string): string => {
  switch (severity) {
    case 'red': return '#fef2f2';
    case 'yellow': return '#fffbeb';
    case 'info': return '#f0f9ff';
    default: return '#f9fafb';
  }
};

// Get status color
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'resolved': return '#059669';
    case 'in_progress': return '#d97706';
    case 'new': return '#dc2626';
    case 'closed': return '#6b7280';
    default: return '#6b7280';
  }
};

// Get status background color
export const getStatusBgColor = (status: string): string => {
  switch (status) {
    case 'resolved': return '#f0fdf4';
    case 'in_progress': return '#fffbeb';
    case 'new': return '#fef2f2';
    case 'closed': return '#f9fafb';
    default: return '#f9fafb';
  }
};

// Group insights by type and severity
export const groupInsightsByTypeAndSeverity = (insights: CustomerSuccessInsight[], sortConfig?: SortConfig): GroupedInsight[] => {
  const groups: { [key: string]: GroupedInsight } = {};
  
  insights.forEach(insight => {
    const groupKey = `${insight.type}_${insight.severity}`;
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        id: groupKey,
        type: insight.type,
        severity: insight.severity,
        message: insight.message,
        count: 1,
        children: [insight],
        hasChildren: false
      };
    } else {
      groups[groupKey].count++;
      groups[groupKey].children.push(insight);
    }
  });
  
  // Mark groups with multiple children
  Object.values(groups).forEach(group => {
    if (group.children.length > 1) {
      group.hasChildren = true;
    }
  });
  
  return Object.values(groups).sort((a, b) => {
    // Apply custom sorting if provided
    if (sortConfig) {
      return sortGroupedInsights(a, b, sortConfig);
    }
    
    // Default sorting: by severity (red first, then yellow, then info)
    const severityOrder = { red: 0, yellow: 1, info: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    
    // Then by count (descending)
    return b.count - a.count;
  });
};

// Sort grouped insights based on sort configuration
export const sortGroupedInsights = (a: GroupedInsight, b: GroupedInsight, sortConfig: SortConfig): number => {
  const { field, order } = sortConfig;
  const multiplier = order === 'asc' ? 1 : -1;
  
  switch (field) {
    case 'severity': {
      const severityOrder = { red: 0, yellow: 1, info: 2 };
      return (severityOrder[a.severity] - severityOrder[b.severity]) * multiplier;
    }
    
    case 'period': {
      // Use the first insight's createdAt field to calculate period for comparison
      const aPeriod = a.children[0]?.createdAt ? formatWeekYear(a.children[0].createdAt) : '';
      const bPeriod = b.children[0]?.createdAt ? formatWeekYear(b.children[0].createdAt) : '';
      return aPeriod.localeCompare(bPeriod) * multiplier;
    }
    
    case 'status': {
      // Use the most common status in the group, or first insight's status
      const getMostCommonStatus = (group: GroupedInsight): string => {
        const statusCounts: { [key: string]: number } = {};
        group.children.forEach(insight => {
          const status = insight.status || 'new';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        return Object.keys(statusCounts).reduce((a, b) => statusCounts[a] > statusCounts[b] ? a : b);
      };
      
      const aStatus = getMostCommonStatus(a);
      const bStatus = getMostCommonStatus(b);
      return aStatus.localeCompare(bStatus) * multiplier;
    }
    
    case 'assignee': {
      // Use the most common assignee in the group, or first insight's assignee
      const getMostCommonAssignee = (group: GroupedInsight): string => {
        const assigneeCounts: { [key: string]: number } = {};
        group.children.forEach(insight => {
          const assignee = insight.assignee || 'unassigned';
          assigneeCounts[assignee] = (assigneeCounts[assignee] || 0) + 1;
        });
        return Object.keys(assigneeCounts).reduce((a, b) => assigneeCounts[a] > assigneeCounts[b] ? a : b);
      };
      
      const aAssignee = getMostCommonAssignee(a);
      const bAssignee = getMostCommonAssignee(b);
      return aAssignee.localeCompare(bAssignee) * multiplier;
    }
    
    default:
      return 0;
  }
};

// Format insight type for display
export const formatInsightType = (type: string): string => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Format severity for display (return proper labels)
export const formatSeverity = (severity: string): string => {
  switch (severity) {
    case 'red': return 'Critical';
    case 'yellow': return 'Warning';
    case 'info': return 'Info';
    default: return severity.charAt(0).toUpperCase() + severity.slice(1);
  }
};

// Get user name by ID
export const getUserNameById = (userId: string, users: Array<{ _id: string; name: string; email: string }>): string => {
  const user = users.find(u => u._id === userId);
  return user ? user.name : 'Unknown User';
};
