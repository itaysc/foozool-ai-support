import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
  alpha,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert
} from '@mui/material';
import { Tooltip } from '@mui/material';
import Select from '@/components/base/Select';
import AssigneeSelector from './AssigneeSelector';
import StatusSelector from './StatusSelector';
import { 
  ExpandMore, 
  ExpandLess, 
  ChevronRight,
  KeyboardArrowDown,
  Person
} from '@mui/icons-material';
import { CustomerSuccessInsight } from '@/types/customerSuccess';
import insightsService from '@/services/insights-service';

interface InsightsTableProps {
  insights: CustomerSuccessInsight[];
  onInsightSelect: (insight: CustomerSuccessInsight) => void;
  selectedCustomer?: string | null;
  customers?: any[];
  onCustomerChange?: (customerId: string) => void;
  onInsightUpdate?: (insightId: string, updates: Partial<CustomerSuccessInsight>) => void;
}

interface GroupedInsight {
  id: string;
  type: string;
  severity: 'red' | 'yellow' | 'info';
  message: string;
  count: number;
  children: CustomerSuccessInsight[];
  hasChildren: boolean;
}

const InsightsTable: React.FC<InsightsTableProps> = ({
  insights,
  onInsightSelect,
  selectedCustomer,
  customers = [],
  onCustomerChange,
  onInsightUpdate
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<Array<{ _id: string; name: string; email: string; avatar?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [localInsights, setLocalInsights] = useState<CustomerSuccessInsight[]>(insights);
  const [updatingInsights, setUpdatingInsights] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Sync local insights with props
  useEffect(() => {
    setLocalInsights(insights);
  }, [insights]);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await insightsService.getUsers();
        if (response.success) {
          const formattedUsers = response.data.map(user => ({
            _id: user._id,
            name: user.fullName || `${user.firstName} ${user.lastName}`,
            email: user.email
          }));
          setUsers(formattedUsers);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setSnackbar({
          open: true,
          message: 'Failed to fetch users',
          severity: 'error'
        });
      }
    };

    fetchUsers();
  }, []);

  // Group insights by type and severity
  const groupedInsights = useMemo(() => {
    const groups: { [key: string]: GroupedInsight } = {};
    
    localInsights.forEach(insight => {
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
        groups[groupKey].hasChildren = true;
      }
    });

    return Object.values(groups);
  }, [localInsights]);

  const toggleRowExpansion = (rowId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  // Helper function to update insight optimistically
  const updateInsightOptimistically = (insightId: string, updates: Partial<CustomerSuccessInsight>) => {
    setLocalInsights(prevInsights => 
      prevInsights.map(insight => 
        insight.id === insightId 
          ? { ...insight, ...updates }
          : insight
      )
    );
    if (onInsightUpdate) onInsightUpdate(insightId, updates);
  };

  // Helper function to revert insight changes
  const revertInsightChange = (insightId: string) => {
    const originalInsight = insights.find(insight => insight.id === insightId);
    if (originalInsight) {
      setLocalInsights(prevInsights => 
        prevInsights.map(insight => 
          insight.id === insightId 
            ? originalInsight
            : insight
        )
      );
    }
  };

  const handleRowClick = (group: GroupedInsight, child?: CustomerSuccessInsight, event?: React.MouseEvent) => {
    // Check if the click was on an assignee selector
    if (event && (event.target as HTMLElement).closest('.assignee-selector')) {
      return; // Don't handle row click if clicking on assignee selector
    }

    if (child) {
      // Clicked on a child insight - show details
      onInsightSelect(child);
    } else if (group.hasChildren) {
      // Clicked on a parent with children - toggle expansion
      toggleRowExpansion(group.id);
    } else {
      // Clicked on a parent without children - show details
      onInsightSelect(group.children[0]);
    }
  };

  const handleAssigneeChange = async (insightId: string, assignee: string | null) => {
    // Store the original assignee for potential rollback
    const originalInsight = localInsights.find(insight => insight.id === insightId);
    const originalAssignee = originalInsight?.assignee;
    
    // Add to updating set
    setUpdatingInsights(prev => new Set(prev).add(insightId));
    
    // Optimistically update the UI immediately and notify parent for drawer sync
    updateInsightOptimistically(insightId, { assignee: assignee || undefined });
    
    try {
      await insightsService.updateInsightAssignee(insightId, assignee);
      setSnackbar({
        open: true,
        message: assignee ? 'Assignee updated successfully' : 'Assignee removed successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to update assignee:', error);
      // Revert the optimistic update on failure
      updateInsightOptimistically(insightId, { assignee: originalAssignee });
      setSnackbar({
        open: true,
        message: 'Failed to update assignee',
        severity: 'error'
      });
    } finally {
      // Remove from updating set
      setUpdatingInsights(prev => {
        const newSet = new Set(prev);
        newSet.delete(insightId);
        return newSet;
      });
    }
  };

  const handleStatusChange = async (insightId: string, status: string) => {
    // Store the original status for potential rollback
    const originalInsight = localInsights.find(insight => insight.id === insightId);
    const originalStatus = originalInsight?.status;
    
    // Add to updating set
    setUpdatingInsights(prev => new Set(prev).add(insightId));
    
    // Optimistically update the UI immediately and notify parent for drawer sync
    updateInsightOptimistically(insightId, { status: status as any });
    
    try {
      await insightsService.updateInsightStatus(insightId, status);
      setSnackbar({
        open: true,
        message: 'Status updated successfully',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Failed to update status:', error);
      // Revert the optimistic update on failure
      updateInsightOptimistically(insightId, { status: originalStatus });
      const errorMessage = error.response?.data?.error || 'Failed to update status';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      // Remove from updating set
      setUpdatingInsights(prev => {
        const newSet = new Set(prev);
        newSet.delete(insightId);
        return newSet;
      });
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'red': 
        return {
          color: '#ef4444',
          bgColor: alpha('#ef4444', 0.1),
          label: 'Critical'
        };
      case 'yellow': 
        return {
          color: '#f59e0b',
          bgColor: alpha('#f59e0b', 0.1),
          label: 'Warning'
        };
      case 'info': 
        return {
          color: '#3b82f6',
          bgColor: alpha('#3b82f6', 0.1),
          label: 'Info'
        };
      default: 
        return {
          color: '#6b7280',
          bgColor: alpha('#6b7280', 0.1),
          label: 'Unknown'
        };
    }
  };

  const formatTypeName = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatWeekYear = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    
    // Get the week number of the year
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    
    return `W${weekNumber} ${year}`;
  };

  const getAffectedUsers = (insight: CustomerSuccessInsight) => {
    const users = new Set<string>();
    if (insight.meta?.decliningUserIds) {
      insight.meta.decliningUserIds.forEach((id: string) => users.add(id));
    }
    if (insight.meta?.anomalousUserIds) {
      insight.meta.anomalousUserIds.forEach((id: string) => users.add(id));
    }
    if (insight.meta?.powerUserIds) {
      insight.meta.powerUserIds.forEach((id: string) => users.add(id));
    }
    return Array.from(users);
  };

  const truncateToSentences = (text: string, maxSentences: number = 3) => {
    if (!text) return '';
    const parts = text
      .replace(/\n+/g, ' ')
      .split(/(?<=[\.!?])\s+/)
      .filter(Boolean);
    const truncated = parts.slice(0, maxSentences).join(' ');
    return parts.length > maxSentences ? `${truncated}` : truncated;
  };

  if (isMobile) {
    return (
      <Box>
        {groupedInsights.map((group) => (
          <Paper key={group.id} sx={{ mb: 2, borderRadius: 2 }}>
            <Box 
              sx={{ 
                p: 2, 
                cursor: 'pointer',
                '&:hover': { backgroundColor: alpha('#3b82f6', 0.05) }
              }}
              onClick={() => handleRowClick(group)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {formatTypeName(group.type)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {group.message}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip 
                      label={getSeverityConfig(group.severity).label}
                      size="small"
                      sx={{
                        backgroundColor: getSeverityConfig(group.severity).bgColor,
                        color: getSeverityConfig(group.severity).color,
                        fontWeight: 600
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {group.count} {group.count === 1 ? 'insight' : 'insights'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                  {group.hasChildren && (
                    <IconButton 
                      size="small"
                    >
                      {expandedRows.has(group.id) ? (
                        <KeyboardArrowDown sx={{ fontSize: 16 }} />
                      ) : (
                        <ChevronRight sx={{ fontSize: 16 }} />
                      )}
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>
            
            {group.hasChildren && (
              <Box
                sx={{
                  overflow: 'hidden',
                  transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-in-out 0.1s, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  maxHeight: expandedRows.has(group.id) ? `${group.children.length * 80}px` : '0px',
                  opacity: expandedRows.has(group.id) ? 1 : 0,
                  transform: expandedRows.has(group.id) ? 'translateY(0)' : 'translateY(-10px)',
                  willChange: 'max-height, opacity, transform'
                }}
              >
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                  {group.children.map((child, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        p: 2, 
                        pl: 4,
                        cursor: 'pointer',
                        borderBottom: index < group.children.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        '&:hover': { backgroundColor: alpha('#3b82f6', 0.05) }
                      }}
                      onClick={() => handleRowClick(group, child)}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {child.message}
                      </Typography>
                      {getAffectedUsers(child).length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Affected users: {getAffectedUsers(child).slice(0, 3).join(', ')}
                          {getAffectedUsers(child).length > 3 && ` +${getAffectedUsers(child).length - 3} more`}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        ))}
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {/* Customer Selector */}
      {onCustomerChange && customers.length > 0 && (
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha('#e5e7eb', 0.5)}` }}>
          <Box sx={{ minWidth: 200 }}>
            <Select
              value={selectedCustomer || ''}
              onChange={(value) => onCustomerChange(String(value))}
              label="Select Customer"
              options={customers.map(customer => ({
                value: customer._id,
                label: customer.name
              }))}
              size="small"
              fullWidth={false}
              searchable={true}
              placeholder="Search customers..."
              allowClear={true}
            />
          </Box>
        </Box>
      )}
      
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: alpha('#3b82f6', 0.05) }}>
            <TableCell sx={{ fontWeight: 600, color: '#1f2937', fontSize: '0.85rem', py: 1, width: 40 }}></TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#1f2937', fontSize: '0.85rem', py: 1, width: 120 }}>ID</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#1f2937', fontSize: '0.85rem', py: 1 }}>Insight</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#1f2937', fontSize: '0.85rem', py: 1 }}>Summary</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#1f2937', fontSize: '0.85rem', py: 1 }}>Assignee</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#1f2937', fontSize: '0.85rem', py: 1 }}>Severity</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#1f2937', fontSize: '0.85rem', py: 1 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#1f2937', fontSize: '0.85rem', py: 1 }}>Value</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#1f2937', fontSize: '0.85rem', py: 1 }}>Period</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {groupedInsights.map((group) => (
            <React.Fragment key={group.id}>
              {/* Parent Row */}
              <TableRow 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: alpha('#3b82f6', 0.05) },
                  '&:nth-of-type(odd)': { backgroundColor: alpha('#f8fafc', 0.5) }
                }}
                onClick={(event) => handleRowClick(group, undefined, event)}
              >
                <TableCell sx={{ py: 1, width: 40, textAlign: 'center' }}>
                  {group.hasChildren && (
                    <IconButton 
                      size="small" 
                      sx={{ 
                        p: 0.25, 
                        width: 20, 
                        height: 20
                      }}
                    >
                      {expandedRows.has(group.id) ? (
                        <KeyboardArrowDown sx={{ fontSize: 14 }} />
                      ) : (
                        <ChevronRight sx={{ fontSize: 14 }} />
                      )}
                    </IconButton>
                  )}
                </TableCell>
                <TableCell sx={{ py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                    {group.children[0]?.insightNumber || '-'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                    {formatTypeName(group.type)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 1, maxWidth: 420 }}>
                  <Tooltip title={group.message} placement="top-start" arrow>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {truncateToSentences(group.message, 3)}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ py: 1, textAlign: 'center' }}>
                  <AssigneeSelector
                    assignee={group.children[0]?.assignee}
                    users={users}
                    onAssigneeChange={(assignee) => handleAssigneeChange(group.children[0]?.id || group.children[0]?.meta?.insightId || group.id, assignee)}
                    size="medium"
                    disabled={loading}
                    updating={updatingInsights.has(group.children[0]?.id || group.children[0]?.meta?.insightId || group.id)}
                  />
                </TableCell>
                <TableCell sx={{ py: 1 }}>
                  <Chip 
                    label={getSeverityConfig(group.severity).label}
                    size="small"
                    sx={{
                      backgroundColor: getSeverityConfig(group.severity).color,
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.65rem',
                      height: 20,
                      minWidth: 60,
                      width: 60,
                      justifyContent: 'center'
                    }}
                  />
                </TableCell>
                <TableCell sx={{ py: 1, textAlign: 'center' }}>
                  <StatusSelector
                    status={group.children[0]?.status || 'new'}
                    onStatusChange={(status) => handleStatusChange(group.children[0]?.id || group.children[0]?.meta?.insightId || group.id, status)}
                    disabled={loading}
                    hasPermission={true} // TODO: Check actual permissions
                    updating={updatingInsights.has(group.children[0]?.id || group.children[0]?.meta?.insightId || group.id)}
                  />
                </TableCell>
                <TableCell sx={{ py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                    {group.count}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {formatWeekYear(group.children[0]?.createdAt || new Date().toISOString())}
                  </Typography>
                </TableCell>
              </TableRow>

              {/* Child Rows with Animation */}
              {group.hasChildren && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ p: 0, border: 'none' }}>
                    <Box
                      sx={{
                        overflow: 'hidden',
                        transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-in-out 0.1s, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        maxHeight: expandedRows.has(group.id) ? '1000px' : '0px',
                        opacity: expandedRows.has(group.id) ? 1 : 0,
                        transform: expandedRows.has(group.id) ? 'translateY(0)' : 'translateY(-10px)',
                        willChange: 'max-height, opacity, transform'
                      }}
                    >
                      {group.children.map((child, index) => (
                        <TableRow 
                          key={`${group.id}-child-${index}`}
                          sx={{ 
                            cursor: 'pointer',
                            backgroundColor: alpha('#f8fafc', 0.3),
                            '&:hover': { backgroundColor: alpha('#3b82f6', 0.05) }
                          }}
                          onClick={(event) => handleRowClick(group, child, event)}
                        >
                          <TableCell sx={{ py: 1, width: 40, textAlign: 'center' }}>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                              {child.insightNumber || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                              {formatTypeName(child.type)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1, maxWidth: 420 }}>
                            <Tooltip title={child.message} placement="top-start" arrow>
                              <Typography 
                                variant="body2" 
                                sx={{ fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                              >
                                {truncateToSentences(child.message, 3)}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ py: 1, textAlign: 'center' }}>
                            <AssigneeSelector
                              assignee={child.assignee}
                              users={users}
                              onAssigneeChange={(assignee) => handleAssigneeChange(child.id || child.meta?.insightId || `${group.id}-${index}`, assignee)}
                              size="medium"
                              disabled={loading}
                              updating={updatingInsights.has(child.id || child.meta?.insightId || `${group.id}-${index}`)}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Chip 
                              label={getSeverityConfig(child.severity).label}
                              size="small"
                              sx={{
                                backgroundColor: getSeverityConfig(child.severity).color,
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.65rem',
                                height: 20,
                                minWidth: 60,
                                width: 60,
                                justifyContent: 'center'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1, textAlign: 'center' }}>
                            <StatusSelector
                              status={child.status || 'new'}
                              onStatusChange={(status) => handleStatusChange(child.id || child.meta?.insightId || `${group.id}-${index}`, status)}
                              disabled={loading}
                              hasPermission={true} // TODO: Check actual permissions
                              updating={updatingInsights.has(child.id || child.meta?.insightId || `${group.id}-${index}`)}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                              {getAffectedUsers(child).length}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                              {formatWeekYear(child.createdAt || new Date().toISOString())}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </TableContainer>
  );
};

export default InsightsTable;
