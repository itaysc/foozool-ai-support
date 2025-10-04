import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Divider,
  Modal,
  Paper,
  IconButton
} from '@mui/material';
import { FilterList, Close } from '@mui/icons-material';

interface InsightFilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: {
    severity: string[];
    category: string[];
    timeRange: string;
    status: string[];
    assignee: string[];
  };
  onFiltersChange: (filters: {
    severity: string[];
    category: string[];
    timeRange: string;
    status: string[];
    assignee: string[];
  }) => void;
  users?: Array<{ _id: string; name: string; email: string }>;
}

const InsightFilterPanel: React.FC<InsightFilterPanelProps> = ({
  open,
  onClose,
  filters,
  onFiltersChange,
  users = []
}) => {
  const [tempFilters, setTempFilters] = useState(filters);

  // Sync tempFilters with actual filters when they change
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  const severityOptions = [
    { value: 'red', label: '🔴 Critical', color: '#f44336' },
    { value: 'yellow', label: '🟡 Warning', color: '#ff9800' },
    { value: 'info', label: '🔵 Info', color: '#2196f3' }
  ];

  const categoryOptions = [
    { value: 'risk', label: '🔴 Risk & Red Alerts' },
    { value: 'upsell', label: '🟢 Upsell & Expansion' },
    { value: 'customer_success', label: '🔵 Customer Success & Prep' },
    { value: 'strategic', label: '🟣 Strategic & Predictive' }
  ];

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' }
  ];

  const statusOptions = [
    { value: 'new', label: '🆕 New', color: '#6b7280' },
    { value: 'in_progress', label: '🔄 In Progress', color: '#3b82f6' },
    { value: 'resolved', label: '✅ Resolved', color: '#10b981' },
    { value: 'closed', label: '🔒 Closed', color: '#6b7280' },
    { value: 'reopened', label: '🔄 Reopened', color: '#f59e0b' }
  ];

  const assigneeOptions = [
    { value: 'unassigned', label: '👤 Unassigned', color: '#6b7280' },
    ...users.map(user => ({
      value: user._id,
      label: `👤 ${user.name}`,
      color: '#3b82f6'
    }))
  ];

  const handleSeverityChange = (severity: string, checked: boolean) => {
    const newSeverity = checked
      ? [...tempFilters.severity, severity]
      : tempFilters.severity.filter(s => s !== severity);
    
    setTempFilters({
      ...tempFilters,
      severity: newSeverity
    });
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategory = checked
      ? [...tempFilters.category, category]
      : tempFilters.category.filter(c => c !== category);
    
    setTempFilters({
      ...tempFilters,
      category: newCategory
    });
  };

  const handleTimeRangeChange = (timeRange: string) => {
    setTempFilters({
      ...tempFilters,
      timeRange
    });
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatus = checked
      ? [...tempFilters.status, status]
      : tempFilters.status.filter(s => s !== status);
    
    setTempFilters({
      ...tempFilters,
      status: newStatus
    });
  };

  const handleAssigneeChange = (assignee: string, checked: boolean) => {
    const newAssignee = checked
      ? [...tempFilters.assignee, assignee]
      : tempFilters.assignee.filter(a => a !== assignee);
    
    setTempFilters({
      ...tempFilters,
      assignee: newAssignee
    });
  };

  const clearFilters = () => {
    setTempFilters({
      severity: ['red', 'yellow', 'info'],
      category: ['risk', 'upsell', 'customer_success', 'strategic'],
      timeRange: '30d',
      status: ['new', 'in_progress', 'resolved', 'closed', 'reopened'],
      assignee: ['unassigned', ...users.map(user => user._id)]
    });
  };

  const applyFilters = () => {
    onFiltersChange(tempFilters);
    onClose();
  };

  const handleClose = () => {
    setTempFilters(filters); // Reset to original filters
    onClose();
  };

  const FilterContent = () => (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          🔍 Filter Insights
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </Box>

      {/* Severity Filter */}
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <FormLabel component="legend" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.9rem' }}>
          Severity
        </FormLabel>
        <FormGroup>
          {severityOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={tempFilters.severity.includes(option.value)}
                  onChange={(e) => handleSeverityChange(option.value, e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: option.color, fontWeight: 500 }}>
                  {option.label}
                </Typography>
              }
            />
          ))}
        </FormGroup>
      </FormControl>

      <Divider sx={{ my: 1.5 }} />

      {/* Category Filter */}
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <FormLabel component="legend" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.9rem' }}>
          Category
        </FormLabel>
        <FormGroup>
          {categoryOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={tempFilters.category.includes(option.value)}
                  onChange={(e) => handleCategoryChange(option.value, e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                  {option.label}
                </Typography>
              }
            />
          ))}
        </FormGroup>
      </FormControl>

      <Divider sx={{ my: 1.5 }} />

      {/* Time Range Filter */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Time Range</InputLabel>
        <Select
          value={tempFilters.timeRange}
          onChange={(e) => handleTimeRangeChange(e.target.value)}
          label="Time Range"
          size="small"
        >
          {timeRangeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider sx={{ my: 1.5 }} />

      {/* Status Filter */}
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <FormLabel component="legend" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.9rem' }}>
          Status
        </FormLabel>
        <FormGroup>
          {statusOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={tempFilters.status.includes(option.value)}
                  onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: option.color, fontWeight: 500 }}>
                  {option.label}
                </Typography>
              }
            />
          ))}
        </FormGroup>
      </FormControl>

      <Divider sx={{ my: 1.5 }} />

      {/* Assignee Filter */}
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <FormLabel component="legend" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.9rem' }}>
          Assignee
        </FormLabel>
        <FormGroup>
          {assigneeOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  checked={tempFilters.assignee.includes(option.value)}
                  onChange={(e) => handleAssigneeChange(option.value, e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: option.color, fontWeight: 500 }}>
                  {option.label}
                </Typography>
              }
            />
          ))}
        </FormGroup>
      </FormControl>

      <Divider sx={{ my: 2 }} />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={clearFilters}
          size="small"
        >
          Clear All
        </Button>
        <Button
          variant="outlined"
          onClick={handleClose}
          size="small"
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={applyFilters}
          size="small"
          sx={{ 
            backgroundColor: '#3b82f6',
            '&:hover': { backgroundColor: '#2563eb' }
          }}
        >
          Apply Filters
        </Button>
      </Box>
    </Box>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Paper
        sx={{
          width: '100%',
          maxWidth: 700,
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 2,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        <FilterContent />
      </Paper>
    </Modal>
  );
};

export default InsightFilterPanel;
