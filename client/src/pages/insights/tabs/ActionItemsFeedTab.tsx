import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Stack,
  Button,
  alpha
} from '@mui/material';
import { Refresh, DynamicFeed, ArrowForward } from '@mui/icons-material';
import actionItemsStore from '@/stores/actionItems.store';
import Select from '@/components/base/Select';
import type { IActionItem } from '@/services/action-items-service';

interface ActionItemsFeedTabProps {
  selectedCustomer?: string | null;
  customers?: any[];
  onCustomerChange?: (customerId: string | null) => void;
  onNavigateToActionItem?: (actionItemId: string) => void;
}

const relativeTime = (date?: string | Date) => {
  if (!date) return '';
  const target = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(target.getTime())) return '';
  const diffMs = Date.now() - target.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
};

const ActionItemsFeedTab: React.FC<ActionItemsFeedTabProps> = observer(({
  selectedCustomer,
  customers = [],
  onCustomerChange,
  onNavigateToActionItem
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [localCustomer, setLocalCustomer] = useState<string | null>(selectedCustomer || null);

  useEffect(() => {
    setLocalCustomer(selectedCustomer || null);
  }, [selectedCustomer]);

  const fetchFeedItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await actionItemsStore.fetchActionItemsForContext(selectedCustomer || undefined);
    } catch (err) {
      console.error('Error loading feed action items:', err);
      setError('Failed to load action items feed');
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer]);

  useEffect(() => {
    fetchFeedItems();
  }, [fetchFeedItems]);

  const feedItems = useMemo(() => {
    return [...actionItemsStore.actionItems].sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [actionItemsStore.actionItems]);

  const handleNavigate = (item: IActionItem) => {
    if (item._id && onNavigateToActionItem) {
      onNavigateToActionItem(item._id);
    }
  };

  return (
    <Box>
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 1.5,
                backgroundColor: alpha('#ffffff', 0.2),
              }}
            >
              <DynamicFeed />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Action Item Feed
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Latest updates across all insights
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
                  value={localCustomer || ''}
                  onChange={(value) => {
                    const stringValue = typeof value === 'string' ? value : '';
                    const normalized = stringValue === '' ? null : stringValue;
                    setLocalCustomer(normalized);
                    onCustomerChange(normalized);
                  }}
                  label=""
                  options={[
                    { value: '', label: 'All Customers' },
                    ...customers.map((customer) => ({
                      value: customer._id,
                      label: customer.name
                    }))
                  ]}
                  size="small"
                  fullWidth={true}
                  placeholder="All Customers"
                  searchable={true}
                  allowClear={true}
                />
              </Box>
            )}
            <IconButton
              onClick={fetchFeedItems}
              size="small"
              sx={{
                backgroundColor: alpha('#ffffff', 0.15),
                color: 'white',
                '&:hover': {
                  backgroundColor: alpha('#ffffff', 0.25)
                }
              }}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchFeedItems}>
              Retry
            </Button>
          }
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      ) : feedItems.length === 0 ? (
        <Alert severity="info">
          No action items yet. Newly generated action items will appear here.
        </Alert>
      ) : (
        <Stack spacing={2}>
          {feedItems.map((item) => (
            <Paper
              key={item._id}
              onClick={() => handleNavigate(item)}
              sx={{
                p: 2,
                borderRadius: 2,
                cursor: item._id ? 'pointer' : 'default',
                '&:hover': {
                  boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                  transform: item._id ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.2s ease'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={item.priority || 'P2'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  <Chip
                    label={item.severity || 'medium'}
                    size="small"
                    color={
                      item.severity === 'critical' ? 'error' :
                      item.severity === 'high' ? 'warning' :
                      item.severity === 'medium' ? 'info' :
                      'default'
                    }
                  />
                </Stack>
              </Box>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                sx={{ mt: 2 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {relativeTime(item.createdAt)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    • Status: {item.status || 'new'}
                  </Typography>
                  {item.assignee && (
                    <Typography variant="caption" color="text.secondary">
                      • Assigned to: {typeof item.assignee === 'object' && 'name' in item.assignee
                        ? item.assignee.name
                        : 'View details'}
                    </Typography>
                  )}
                </Stack>

                <Button
                  size="small"
                  endIcon={<ArrowForward fontSize="small" />}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleNavigate(item);
                  }}
                >
                  View Action Item
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
});

export default ActionItemsFeedTab;

