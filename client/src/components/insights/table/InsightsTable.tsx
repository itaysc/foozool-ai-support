import React, { useState, useMemo, useEffect, useImperativeHandle } from 'react';
import {
  Table,
  TableContainer,
  Paper,
  Snackbar,
  Alert
} from '@mui/material';
import { CustomerSuccessInsight } from '@/types/customerSuccess';
import insightsService from '@/services/insights-service';
import { InsightsTableProps } from './types';
import { groupInsightsByTypeAndSeverity } from './utils';
import InsightTableHeader from './InsightTableHeader';
import InsightTableBody from './InsightTableBody';
import InsightTablePagination from './InsightTablePagination';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

const InsightsTable = React.forwardRef<any, InsightsTableProps>(({
  insights,
  onInsightSelect,
  selectedCustomer,
  customers,
  onCustomerChange,
  onInsightUpdate
}, ref) => {
  const [localInsights, setLocalInsights] = useState<CustomerSuccessInsight[]>(insights);
  const [users, setUsers] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [updatingInsights, setUpdatingInsights] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Add fade-in animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
  const allGroupedInsights = useMemo(() => {
    return groupInsightsByTypeAndSeverity(localInsights);
  }, [localInsights]);

  // Paginate grouped insights
  const paginatedGroupedInsights = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allGroupedInsights.slice(startIndex, endIndex);
  }, [allGroupedInsights, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(allGroupedInsights.length / itemsPerPage);

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Toggle group expansion
  const handleToggleExpand = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Handle status change
  const handleStatusChange = async (insightId: string, status: string) => {
    if (!onInsightUpdate) return;
    
    setUpdatingInsights(prev => new Set(prev).add(insightId));
    setLoading(true);
    
    try {
      await onInsightUpdate(insightId, { status: status as any });
      setSnackbar({
        open: true,
        message: 'Status updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to update insight status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update status',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setUpdatingInsights(prev => {
        const newSet = new Set(prev);
        newSet.delete(insightId);
        return newSet;
      });
    }
  };

  // Handle assignee change
  const handleAssigneeChange = async (insightId: string, assigneeId: string | null) => {
    if (!onInsightUpdate) return;
    
    setUpdatingInsights(prev => new Set(prev).add(insightId));
    setLoading(true);
    
    try {
      await onInsightUpdate(insightId, { assignee: assigneeId });
      setSnackbar({
        open: true,
        message: 'Assignee updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to update assignee:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update assignee',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setUpdatingInsights(prev => {
        const newSet = new Set(prev);
        newSet.delete(insightId);
        return newSet;
      });
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    refresh: () => {
      // Refresh logic if needed
    },
    updateInsightOptimistically: (insightId: string, updates: Partial<CustomerSuccessInsight>, skipCallback = false) => {
      // Update local state optimistically
      setLocalInsights(prev => prev.map(insight => {
        if (insight.id === insightId || insight.meta?.insightId === insightId) {
          return { ...insight, ...updates };
        }
        return insight;
      }));
      
      // Call the parent callback if not skipping
      if (!skipCallback && onInsightUpdate) {
        onInsightUpdate(insightId, updates);
      }
    }
  }));

  return (
    <>
      <Paper>
        <TableContainer>
          <Table>
            <InsightTableHeader />
            <InsightTableBody
              groupedInsights={paginatedGroupedInsights}
              expandedGroups={expandedGroups}
              onToggleExpand={handleToggleExpand}
              onInsightSelect={onInsightSelect}
              onStatusChange={handleStatusChange}
              onAssigneeChange={handleAssigneeChange}
              users={users}
              loading={loading}
              updatingInsights={updatingInsights}
              hasPermission={true} // TODO: Check actual permissions
            />
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <InsightTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={allGroupedInsights.length}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </Paper>
      
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
    </>
  );
});

InsightsTable.displayName = 'InsightsTable';

export default InsightsTable;