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
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import apiService from '../../../services/api-service';

interface CustomerTier {
  _id: string;
  name: string;
  description: string;
  priority: number;
  autoActionPermissions: {
    refund: {
      enabled: boolean;
      maxAmount: number;
      maxDailyCount: number;
    };
    coupon: {
      enabled: boolean;
      maxDiscount: number;
      maxDailyCount: number;
    };
    autoResolve: {
      enabled: boolean;
      maxTicketAgeHours: number;
    };
    escalation: {
      enabled: boolean;
      maxEscalationLevel: string;
    };
    priorityChange: {
      enabled: boolean;
      allowedPriorities: string[];
    };
    autoReply: {
      enabled: boolean;
      maxDailyCount: number;
    };
  };
  satisfactionThresholds: {
    lowSatisfactionThreshold: number;
    highSatisfactionThreshold: number;
  };
}

interface CustomerTiersSettingsProps {
  onShowSnackbar: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void;
}

const CustomerTiersSettings: React.FC<CustomerTiersSettingsProps> = ({ onShowSnackbar }) => {
  const [tiers, setTiers] = useState<CustomerTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<CustomerTier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 1,
    autoActionPermissions: {
      refund: {
        enabled: false,
        maxAmount: 0,
        maxDailyCount: 0
      },
      coupon: {
        enabled: false,
        maxDiscount: 0,
        maxDailyCount: 0
      },
      autoResolve: {
        enabled: false,
        maxTicketAgeHours: 0
      },
      escalation: {
        enabled: false,
        maxEscalationLevel: 'low'
      },
      priorityChange: {
        enabled: false,
        allowedPriorities: []
      },
      autoReply: {
        enabled: true,
        maxDailyCount: 10
      }
    },
    satisfactionThresholds: {
      lowSatisfactionThreshold: 3,
      highSatisfactionThreshold: 4
    }
  });

  const escalationLevels = ['low', 'medium', 'high', 'critical'];
  const priorities = ['low', 'medium', 'high', 'urgent', 'critical'];

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      setLoading(true);
      const response = await apiService.customerTiers.getAll();
      if (response.success) {
        setTiers(response.data || []);
      }
    } catch (error) {
      onShowSnackbar('Failed to fetch customer tiers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (tier?: CustomerTier) => {
    if (tier) {
      setEditingTier(tier);
      setFormData(tier);
    } else {
      setEditingTier(null);
      setFormData({
        name: '',
        description: '',
        priority: 1,
        autoActionPermissions: {
          refund: {
            enabled: false,
            maxAmount: 0,
            maxDailyCount: 0
          },
          coupon: {
            enabled: false,
            maxDiscount: 0,
            maxDailyCount: 0
          },
          autoResolve: {
            enabled: false,
            maxTicketAgeHours: 0
          },
          escalation: {
            enabled: false,
            maxEscalationLevel: 'low'
          },
          priorityChange: {
            enabled: false,
            allowedPriorities: []
          },
          autoReply: {
            enabled: true,
            maxDailyCount: 10
          }
        },
        satisfactionThresholds: {
          lowSatisfactionThreshold: 3,
          highSatisfactionThreshold: 4
        }
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTier(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingTier) {
        await apiService.customerTiers.update(editingTier._id, formData);
        onShowSnackbar('Customer tier updated successfully', 'success');
      } else {
        await apiService.customerTiers.create(formData);
        onShowSnackbar('Customer tier created successfully', 'success');
      }
      fetchTiers();
      handleCloseDialog();
    } catch (error) {
      onShowSnackbar('Failed to save customer tier', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer tier?')) {
      try {
        await apiService.customerTiers.delete(id);
        onShowSnackbar('Customer tier deleted successfully', 'success');
      } catch (error) {
        onShowSnackbar('Failed to delete customer tier', 'error');
      }
    }
  };

  const updatePermission = (action: string, field: string, value: any) => {
    setFormData({
      ...formData,
      autoActionPermissions: {
        ...formData.autoActionPermissions,
        [action]: {
          ...formData.autoActionPermissions[action as keyof typeof formData.autoActionPermissions],
          [field]: value
        }
      }
    });
  };

  const updateSatisfactionThreshold = (field: string, value: number) => {
    setFormData({
      ...formData,
      satisfactionThresholds: {
        ...formData.satisfactionThresholds,
        [field]: value
      }
    });
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
        <Typography variant="h5">Customer Tiers Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Tier
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Refund</TableCell>
              <TableCell>Coupon</TableCell>
              <TableCell>Auto Resolve</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tiers.map((tier) => (
              <TableRow key={tier._id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {tier.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {tier.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={`Priority ${tier.priority}`} size="small" />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={tier.autoActionPermissions.refund.enabled ? 'Enabled' : 'Disabled'} 
                    color={tier.autoActionPermissions.refund.enabled ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={tier.autoActionPermissions.coupon.enabled ? 'Enabled' : 'Disabled'} 
                    color={tier.autoActionPermissions.coupon.enabled ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={tier.autoActionPermissions.autoResolve.enabled ? 'Enabled' : 'Disabled'} 
                    color={tier.autoActionPermissions.autoResolve.enabled ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(tier)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(tier._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingTier ? 'Edit Customer Tier' : 'Add New Customer Tier'}</DialogTitle>
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
            <TextField
              fullWidth
              label="Priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            />

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Auto Action Permissions</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Refund Permissions */}
                  <Box>
                    <Typography variant="subtitle1">Refund Permissions</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.autoActionPermissions.refund.enabled}
                          onChange={(e) => updatePermission('refund', 'enabled', e.target.checked)}
                        />
                      }
                      label="Enable Refunds"
                    />
                    <TextField
                      label="Max Amount"
                      type="number"
                      value={formData.autoActionPermissions.refund.maxAmount}
                      onChange={(e) => updatePermission('refund', 'maxAmount', parseFloat(e.target.value))}
                      sx={{ mr: 2 }}
                    />
                    <TextField
                      label="Max Daily Count"
                      type="number"
                      value={formData.autoActionPermissions.refund.maxDailyCount}
                      onChange={(e) => updatePermission('refund', 'maxDailyCount', parseInt(e.target.value))}
                    />
                  </Box>

                  {/* Coupon Permissions */}
                  <Box>
                    <Typography variant="subtitle1">Coupon Permissions</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.autoActionPermissions.coupon.enabled}
                          onChange={(e) => updatePermission('coupon', 'enabled', e.target.checked)}
                        />
                      }
                      label="Enable Coupons"
                    />
                    <TextField
                      label="Max Discount"
                      type="number"
                      value={formData.autoActionPermissions.coupon.maxDiscount}
                      onChange={(e) => updatePermission('coupon', 'maxDiscount', parseFloat(e.target.value))}
                      sx={{ mr: 2 }}
                    />
                    <TextField
                      label="Max Daily Count"
                      type="number"
                      value={formData.autoActionPermissions.coupon.maxDailyCount}
                      onChange={(e) => updatePermission('coupon', 'maxDailyCount', parseInt(e.target.value))}
                    />
                  </Box>

                  {/* Auto Resolve Permissions */}
                  <Box>
                    <Typography variant="subtitle1">Auto Resolve Permissions</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.autoActionPermissions.autoResolve.enabled}
                          onChange={(e) => updatePermission('autoResolve', 'enabled', e.target.checked)}
                        />
                      }
                      label="Enable Auto Resolve"
                    />
                    <TextField
                      label="Max Ticket Age (Hours)"
                      type="number"
                      value={formData.autoActionPermissions.autoResolve.maxTicketAgeHours}
                      onChange={(e) => updatePermission('autoResolve', 'maxTicketAgeHours', parseInt(e.target.value))}
                    />
                  </Box>

                  {/* Escalation Permissions */}
                  <Box>
                    <Typography variant="subtitle1">Escalation Permissions</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.autoActionPermissions.escalation.enabled}
                          onChange={(e) => updatePermission('escalation', 'enabled', e.target.checked)}
                        />
                      }
                      label="Enable Escalation"
                    />
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>Max Escalation Level</InputLabel>
                      <Select
                        value={formData.autoActionPermissions.escalation.maxEscalationLevel}
                        onChange={(e) => updatePermission('escalation', 'maxEscalationLevel', e.target.value)}
                        label="Max Escalation Level"
                      >
                        {escalationLevels.map((level) => (
                          <MenuItem key={level} value={level}>{level}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Auto Reply Permissions */}
                  <Box>
                    <Typography variant="subtitle1">Auto Reply Permissions</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.autoActionPermissions.autoReply.enabled}
                          onChange={(e) => updatePermission('autoReply', 'enabled', e.target.checked)}
                        />
                      }
                      label="Enable Auto Reply"
                    />
                    <TextField
                      label="Max Daily Count"
                      type="number"
                      value={formData.autoActionPermissions.autoReply.maxDailyCount}
                      onChange={(e) => updatePermission('autoReply', 'maxDailyCount', parseInt(e.target.value))}
                    />
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Satisfaction Thresholds</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Low Satisfaction Threshold"
                    type="number"
                    value={formData.satisfactionThresholds.lowSatisfactionThreshold}
                    onChange={(e) => updateSatisfactionThreshold('lowSatisfactionThreshold', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 5 }}
                  />
                  <TextField
                    label="High Satisfaction Threshold"
                    type="number"
                    value={formData.satisfactionThresholds.highSatisfactionThreshold}
                    onChange={(e) => updateSatisfactionThreshold('highSatisfactionThreshold', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 5 }}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTier ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerTiersSettings; 