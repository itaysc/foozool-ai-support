import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Typography, Alert, Paper, CircularProgress, IconButton, Select as MuiSelect, MenuItem, FormControl, InputLabel, Button, alpha, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { FilterList, Refresh, Clear, AssignmentInd } from '@mui/icons-material';
import { IActionItem } from '@/services/action-items-service';
import actionItemsStore from '@/stores/actionItems.store';
import Select from '@/components/base/Select';
import AssigneeSelector from '@/components/insights/forms/AssigneeSelector';
import StatusSelector from '@/components/insights/filters/StatusSelector';
import { insightsService } from '@/services/insights-service';
import ActionItemDetailDrawer from '@/components/action-items/ActionItemDetailDrawer';
import { useSearchParams } from 'react-router-dom';

interface ActionItemsTabProps {
  selectedCustomer?: string | null;
  customers?: any[];
  onCustomerChange?: (customerId: string) => void;
}

const ActionItemsTab: React.FC<ActionItemsTabProps> = ({
  selectedCustomer,
  customers = [],
  onCustomerChange
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [users, setUsers] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedActionItem, setSelectedActionItem] = useState<IActionItem | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const actionItemIdFromQuery = searchParams.get('actionItemId');

  const updateActionItemQueryParam = useCallback((actionItemId?: string) => {
    const params = new URLSearchParams(searchParams);
    if (actionItemId) {
      params.set('actionItemId', actionItemId);
    } else {
      params.delete('actionItemId');
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

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
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    fetchActionItems();
  }, [selectedCustomer]);

  const fetchActionItems = async () => {
    try {
      setLoading(true);
      setError(null);
      await actionItemsStore.fetchActionItemsForContext(selectedCustomer);
    } catch (err) {
      console.error('Error fetching action items:', err);
      setError('Failed to load action items');
    } finally {
      setLoading(false);
    }
  };

  // Sync drawer open state with URL param for deep linking
  useEffect(() => {
    if (!actionItemIdFromQuery) {
      if (drawerOpen) {
        setDrawerOpen(false);
        setSelectedActionItem(null);
      }
      return;
    }

    const target = actionItemsStore.actionItems.find(item => item._id === actionItemIdFromQuery);
    if (target) {
      setSelectedActionItem(target);
      setDrawerOpen(true);
    }
  }, [actionItemIdFromQuery, actionItemsStore.actionItems, drawerOpen]);

  // Filter action items based on selected filters
  const filteredActionItems = useMemo(() => {
    return actionItemsStore.actionItems.filter(item => {
      // Customer filter is already applied at the fetch level
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
      return true;
    });
  }, [actionItemsStore.actionItems, statusFilter, priorityFilter, severityFilter]);

  const clearFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setSeverityFilter('all');
  };

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || severityFilter !== 'all';

  // Handle assignee change
  const handleAssigneeChange = async (actionItemId: string, assigneeId: string | null) => {
    // Optimistic update - update UI immediately
    actionItemsStore.actionItems = actionItemsStore.actionItems.map(item =>
      item._id === actionItemId ? { ...item, assignee: assigneeId || undefined } : item
    );
    
    try {
      await actionItemsStore.updateAssignee(actionItemId, assigneeId);
      setError(null);
    } catch (err) {
      console.error('Error updating assignee:', err);
      setError('Failed to update assignee');
      // Revert on error - reload from server
      await fetchActionItems();
    }
  };

  // Handle status change
  const handleStatusChange = async (actionItemId: string, status: IActionItem['status']) => {
    // Optimistic update - update UI immediately
    actionItemsStore.actionItems = actionItemsStore.actionItems.map(item =>
      item._id === actionItemId ? { ...item, status } : item
    );
    
    try {
      await actionItemsStore.updateStatus(actionItemId, status);
      setError(null);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
      // Revert on error - reload from server
      await fetchActionItems();
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    return {
      total: actionItemsStore.actionItems.length,
      critical: actionItemsStore.actionItems.filter(i => i.severity === 'critical').length,
      high: actionItemsStore.actionItems.filter(i => i.severity === 'high').length,
      medium: actionItemsStore.actionItems.filter(i => i.severity === 'medium').length,
    };
  }, [actionItemsStore.actionItems]);

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <IconButton onClick={fetchActionItems} size="small">
            <Refresh />
          </IconButton>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Gradient Background */}
      <Paper sx={{
        p: 1.5,
        mb: 2,
        borderRadius: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              p: 0.75,
              borderRadius: 1.5,
              backgroundColor: alpha('#ffffff', 0.2),
              color: 'white'
            }}>
              <AssignmentInd sx={{ fontSize: 18 }} />
            </Box>
            <Typography variant="h5" sx={{ 
              fontWeight: 700,
              fontSize: '1.5rem'
            }}>
              Action Items Overview
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* Customer Filter Dropdown */}
            {customers && customers.length > 0 && onCustomerChange && (
              <Box sx={{ 
                width: 280,
                minWidth: 280,
                '& .MuiFormControl-root': {
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    height: '32px',
                    backgroundColor: alpha('#ffffff', 0.9),
                    color: '#495057',
                    fontWeight: 500,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiSelect-select': {
                      padding: '6px 12px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }
                  }
                }
              }}>
                <Select
                  value={selectedCustomer || ''}
                  onChange={(value) => onCustomerChange(value as string)}
                  label=""
                  options={customers.map((customer) => ({
                    value: customer._id,
                    label: customer.name
                  }))}
                  size="small"
                  fullWidth={true}
                  placeholder="All Customers"
                  searchable={true}
                  allowClear={true}
                />
              </Box>
            )}
            
            <IconButton 
              onClick={() => {}}
              size="small"
              sx={{ 
                backgroundColor: alpha('#ffffff', 0.1),
                color: 'white',
                '&:hover': {
                  backgroundColor: alpha('#ffffff', 0.2)
                }
              }}
            >
              <FilterList sx={{ fontSize: 18 }} />
            </IconButton>
            
            <IconButton 
              onClick={fetchActionItems}
              size="small"
              sx={{ 
                backgroundColor: alpha('#ffffff', 0.1),
                color: 'white',
                '&:hover': {
                  backgroundColor: alpha('#ffffff', 0.2)
                }
              }}
            >
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Filters */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <MuiSelect
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="new">New</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
            <MenuItem value="reopened">Reopened</MenuItem>
          </MuiSelect>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Priority</InputLabel>
          <MuiSelect
            value={priorityFilter}
            label="Priority"
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <MenuItem value="all">All Priorities</MenuItem>
            <MenuItem value="P0">P0 - Critical</MenuItem>
            <MenuItem value="P1">P1 - High</MenuItem>
            <MenuItem value="P2">P2 - Medium-High</MenuItem>
            <MenuItem value="P3">P3 - Medium</MenuItem>
            <MenuItem value="P4">P4 - Low-Medium</MenuItem>
            <MenuItem value="P5">P5 - Low</MenuItem>
          </MuiSelect>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Severity</InputLabel>
          <MuiSelect
            value={severityFilter}
            label="Severity"
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <MenuItem value="all">All Severity</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </MuiSelect>
        </FormControl>

        {hasActiveFilters && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Clear />}
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      ) : actionItemsStore.actionItems.length === 0 ? (
        <Alert severity="info">
          No action items available. Action items will appear here when they are created from insights.
        </Alert>
      ) : filteredActionItems.length === 0 ? (
        <Alert severity="info" action={
          <Button size="small" onClick={clearFilters}>Clear Filters</Button>
        }>
          No action items match the selected filters.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f0f8ff' }}>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', backgroundColor: '#f0f8ff', py: 0.5 }}>
                  Title
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', textAlign: 'center', backgroundColor: '#f0f8ff', py: 0.5 }}>
                  Priority
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', textAlign: 'center', backgroundColor: '#f0f8ff', py: 0.5 }}>
                  Severity
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', textAlign: 'center', backgroundColor: '#f0f8ff', py: 0.5 }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', textAlign: 'center', backgroundColor: '#f0f8ff', py: 0.5 }}>
                  Assignee
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'text.primary', textAlign: 'center', backgroundColor: '#f0f8ff', py: 0.5 }}>
                  Created
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredActionItems.map((item) => (
                <TableRow
                  key={item._id}
                  hover
                  onClick={() => {
                    setSelectedActionItem(item);
                    setDrawerOpen(true);
                    if (item._id) {
                      updateActionItemQueryParam(item._id);
                    }
                  }}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  <TableCell sx={{ py: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        lineHeight: 1.4
                      }}
                    >
                      {item.title}
                    </Typography>
                    {item.description && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                          fontSize: '0.8rem',
                          lineHeight: 1.4
                        }}
                      >
                        {item.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1, textAlign: 'center' }}>
                    <Chip
                      label={item.priority || 'P2'}
                      size="small"
                      sx={{
                        backgroundColor: item.priority === 'P0' ? '#f8d7da' : 
                                        item.priority === 'P1' ? '#fff3cd' :
                                        item.priority === 'P2' ? '#d1ecf1' :
                                        '#d4edda',
                        color: item.priority === 'P0' ? '#721c24' :
                               item.priority === 'P1' ? '#856404' :
                               item.priority === 'P2' ? '#0c5460' :
                               '#155724',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 20
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1, textAlign: 'center' }}>
                    <Chip
                      label={item.severity || 'medium'}
                      size="small"
                      color={
                        item.severity === 'critical' ? 'error' :
                        item.severity === 'high' ? 'warning' :
                        item.severity === 'medium' ? 'info' :
                        'default'
                      }
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 20
                      }}
                    />
                  </TableCell>
                  <TableCell 
                    sx={{ py: 1, textAlign: 'center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StatusSelector
                      status={item.status || 'new'}
                      onStatusChange={(status) => {
                        if (item._id) {
                          handleStatusChange(item._id, status as IActionItem['status']);
                        }
                      }}
                      disabled={loading}
                      hasPermission={true}
                      updating={false}
                    />
                  </TableCell>
                  <TableCell 
                    sx={{ py: 1, textAlign: 'center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <AssigneeSelector
                      assignee={item.assignee}
                      users={users}
                      onAssigneeChange={(userId) => {
                        if (item._id) {
                          handleAssigneeChange(item._id, userId);
                        }
                      }}
                      size="small"
                      disabled={loading}
                      updating={false}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1, textAlign: 'center' }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ fontSize: '0.8rem' }}
                    >
                      {item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Item Detail Drawer */}
      <ActionItemDetailDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedActionItem(null);
          updateActionItemQueryParam();
        }}
        actionItem={selectedActionItem}
        users={users}
        onActionItemUpdate={async (actionItemId: string, updates: Partial<IActionItem>) => {
          // Handle status update
          if (updates.status) {
            await handleStatusChange(actionItemId, updates.status);
          }
          // Handle assignee update
          if (updates.assignee !== undefined) {
            await handleAssigneeChange(actionItemId, updates.assignee || null);
          }
        }}
      />
    </Box>
  );
};

export default observer(ActionItemsTab);
