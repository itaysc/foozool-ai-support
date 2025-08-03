import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import apiService from '../../../services/api-service';

interface ActionThreshold {
  _id: string;
  name: string;
  description: string;
  actionType: 'refund' | 'coupon' | 'auto_resolve' | 'escalate' | 'priority_change' | 'auto_reply';
  conditions: {
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
    value: any;
  }[];
  threshold: number;
  isActive: boolean;
  priority: number;
  maxDailyActions?: number;
  actionConfig: {
    refundAmount?: number;
    couponCode?: string;
    couponDiscount?: number;
    autoReplyTemplate?: string;
    escalationLevel?: string;
    newPriority?: string;
  };
}

interface ActionThresholdsSettingsProps {
  onShowSnackbar: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void;
}

const ActionThresholdsSettings: React.FC<ActionThresholdsSettingsProps> = ({ onShowSnackbar }) => {
  const [thresholds, setThresholds] = useState<ActionThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<ActionThreshold | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    actionType: 'auto_reply' as const,
    threshold: 0.5,
    isActive: true,
    priority: 0,
    maxDailyActions: 10,
    conditions: [{ field: '', operator: 'equals' as const, value: '' }],
    actionConfig: {}
  });

  const actionTypes = ['refund', 'coupon', 'auto_resolve', 'escalate', 'priority_change', 'auto_reply'];
  const operators = ['equals', 'greater_than', 'less_than', 'contains', 'in'];
  const fields = ['priority', 'satisfaction_rating', 'ticket_age_hours', 'customer_tier', 'issue_type'];

  useEffect(() => {
    fetchThresholds();
  }, []);

  const fetchThresholds = async () => {
    try {
      setLoading(true);
      const response = await apiService.actionThresholds.getAll();
      if (response.success) {
        setThresholds(response.data || []);
      }
    } catch (error) {
      onShowSnackbar('Failed to fetch action thresholds', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (threshold?: ActionThreshold) => {
    if (threshold) {
      setEditingThreshold(threshold);
      setFormData({
        name: threshold.name,
        description: threshold.description,
        actionType: threshold.actionType,
        threshold: threshold.threshold,
        isActive: threshold.isActive,
        priority: threshold.priority,
        maxDailyActions: threshold.maxDailyActions || 10,
        conditions: threshold.conditions,
        actionConfig: threshold.actionConfig
      });
    } else {
      setEditingThreshold(null);
      setFormData({
        name: '',
        description: '',
        actionType: 'auto_reply',
        threshold: 0.5,
        isActive: true,
        priority: 0,
        maxDailyActions: 10,
        conditions: [{ field: '', operator: 'equals', value: '' }],
        actionConfig: {}
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingThreshold(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingThreshold) {
        await apiService.actionThresholds.update(editingThreshold._id, formData);
        onShowSnackbar('Action threshold updated successfully', 'success');
      } else {
        await apiService.actionThresholds.create(formData);
        onShowSnackbar('Action threshold created successfully', 'success');
      }
      fetchThresholds();
      handleCloseDialog();
    } catch (error) {
      onShowSnackbar('Failed to save action threshold', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this action threshold?')) {
      try {
        await apiService.actionThresholds.delete(id);
        onShowSnackbar('Action threshold deleted successfully', 'success');
        fetchThresholds();
      } catch (error) {
        onShowSnackbar('Failed to delete action threshold', 'error');
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await apiService.actionThresholds.toggleStatus(id);
      onShowSnackbar('Action threshold status updated successfully', 'success');
      fetchThresholds();
    } catch (error) {
      onShowSnackbar('Failed to update action threshold status', 'error');
    }
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { field: '', operator: 'equals', value: '' }]
    });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index)
    });
  };

  const updateCondition = (index: number, field: string, value: any) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFormData({ ...formData, conditions: newConditions });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Action Thresholds Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Threshold
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Action Type</TableCell>
              <TableCell>Threshold</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {thresholds.map((threshold) => (
              <TableRow key={threshold._id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {threshold.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {threshold.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={threshold.actionType.replace('_', ' ')} size="small" />
                </TableCell>
                <TableCell>{(threshold.threshold * 100).toFixed(1)}%</TableCell>
                <TableCell>{threshold.priority}</TableCell>
                <TableCell>
                  <Chip 
                    label={threshold.isActive ? 'Active' : 'Inactive'} 
                    color={threshold.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleToggleStatus(threshold._id)}>
                    <Switch checked={threshold.isActive} size="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleOpenDialog(threshold)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(threshold._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingThreshold ? 'Edit Action Threshold' : 'Add New Action Threshold'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
            />
            <FormControl fullWidth>
              <InputLabel>Action Type</InputLabel>
              <Select
                value={formData.actionType}
                onChange={(e) => setFormData({ ...formData, actionType: e.target.value as any })}
                label="Action Type"
              >
                {actionTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type.replace('_', ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Threshold (0-1)"
              type="number"
              value={formData.threshold}
              onChange={(e) => setFormData({ ...formData, threshold: parseFloat(e.target.value) })}
              inputProps={{ min: 0, max: 1, step: 0.1 }}
            />
            <TextField
              fullWidth
              label="Priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            />
            <TextField
              fullWidth
              label="Max Daily Actions"
              type="number"
              value={formData.maxDailyActions}
              onChange={(e) => setFormData({ ...formData, maxDailyActions: parseInt(e.target.value) })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
            
            <Typography variant="h6" sx={{ mt: 2 }}>Conditions</Typography>
            {formData.conditions.map((condition, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Field</InputLabel>
                  <Select
                    value={condition.field}
                    onChange={(e) => updateCondition(index, 'field', e.target.value)}
                    label="Field"
                  >
                    {fields.map((field) => (
                      <MenuItem key={field} value={field}>{field}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Operator</InputLabel>
                  <Select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    label="Operator"
                  >
                    {operators.map((op) => (
                      <MenuItem key={op} value={op}>{op}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Value"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, 'value', e.target.value)}
                  sx={{ flex: 1 }}
                />
                <IconButton onClick={() => removeCondition(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button onClick={addCondition} variant="outlined" size="small">
              Add Condition
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingThreshold ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActionThresholdsSettings; 