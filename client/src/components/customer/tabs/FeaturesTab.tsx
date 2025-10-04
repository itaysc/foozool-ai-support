import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  CircularProgress,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { CreateCustomerRequest } from '@/types';
import { observer } from 'mobx-react';
import SelectBase from '@/components/base/Select';
import Modal from '@/components/Modal';
import customerActivityStore from '@/stores/customer-activity.store';
import toast from '@/utils/toast';

interface FeaturesTabProps {
  formData: CreateCustomerRequest;
  mode: 'create' | 'edit';
  customerId?: string;
}

const FeaturesTab: React.FC<FeaturesTabProps> = ({
  mode,
  customerId,
}) => {
  const [addUsageOpen, setAddUsageOpen] = useState(false);
  const [newUsage, setNewUsage] = useState<{ 
    featureName: string; 
    metricType: 'count' | 'amount' | 'percentage' | 'duration' | 'custom'; 
    metricValue?: number; 
    unit?: string; 
    usageDate?: string; 
  }>({ featureName: '', metricType: 'count' });

  const handleAddUsage = async () => {
    try {
      if (!customerId) return;
      const solutionName = newUsage.featureName?.trim();
      if (!solutionName) return;
      
      // First, upsert the solution name to ensure it appears in future dropdowns
      await customerActivityStore.upsertSolution(solutionName);
      
      if (!newUsage.metricValue) return;
      
      await customerActivityStore.addUsage({
        customerId,
        solutionName,
        metricType: newUsage.metricType,
        metricValue: newUsage.metricValue,
        unit: newUsage.unit,
        activityDate: newUsage.usageDate ? new Date(newUsage.usageDate).toISOString() : undefined,
      } as any);
      setAddUsageOpen(false);
      setNewUsage({ featureName: '', metricType: 'count' });
      toast.success('Activity added successfully');
    } catch (error) {
      console.error('Failed to add activity:', error);
      toast.error('Failed to add activity. Please try again.');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await customerActivityStore.deleteActivity(activityId, customerId!);
        toast.success('Activity deleted successfully');
      } catch (error) {
        console.error('Failed to delete activity:', error);
        toast.error('Failed to delete activity. Please try again.');
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Usage History</Typography>
        <Button variant="text" onClick={() => setAddUsageOpen(true)}>+ Add Activity</Button>
      </Box>
      
      {mode === 'edit' && customerId ? (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Solution</TableCell>
                <TableCell>Metric Type</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Activity Date</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(customerActivityStore.usageByCustomer[customerId] || []).map((u: any) => (
                <TableRow key={u._id}>
                  <TableCell>{u.solutionName || u.featureName}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {u.metricType || (u.utilizationPercent !== undefined ? 'percentage' : (u.activeUsersCount !== undefined ? 'count' : '-'))}
                  </TableCell>
                  <TableCell align="right">
                    {u.metricValue ?? u.utilizationPercent ?? u.activeUsersCount ?? '-'}
                  </TableCell>
                  <TableCell>{u.unit || '-'}</TableCell>
                  <TableCell>
                    {u.activityDate ? new Date(u.activityDate).toISOString().split('T')[0] :
                     u.periodStart || u.periodEnd ? `${u.periodStart ? new Date(u.periodStart).toISOString().split('T')[0] : ''} - ${u.periodEnd ? new Date(u.periodEnd).toISOString().split('T')[0] : ''}` :
                     (u.usageDate ? new Date(u.usageDate).toISOString().split('T')[0] : '-')}
                  </TableCell>
                  <TableCell>{new Date(u.createdAt).toISOString().split('T')[0]}</TableCell>
                  <TableCell>
                    <Tooltip title="Delete Activity">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteActivity(u._id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {(!customerActivityStore.usageByCustomer[customerId] || customerActivityStore.usageByCustomer[customerId].length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} align="center">No usage entries yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </>
      ) : (
        <Alert severity="info">Save the customer first to manage feature usage.</Alert>
      )}

      {/* Add Usage Modal */}
      <Modal 
        open={addUsageOpen} 
        onClose={() => setAddUsageOpen(false)} 
        title="Add Customer Activity" 
        maxWidth="sm" 
        contentTopGap={5}
        actions={
          <>
            <Button onClick={() => setAddUsageOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAddUsage}>Add Usage</Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SelectBase
            value={newUsage.featureName}
            onChange={(v) => setNewUsage(prev => ({ ...prev, featureName: String(v) }))}
            label="Solution (name)"
            placeholder="Enter name or pick"
            allowOther
            allowClear
            options={customerActivityStore.solutions.map(s => s.name)}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <SelectBase
              value={newUsage.metricType}
              onChange={(v) => setNewUsage(prev => ({ ...prev, metricType: v as any }))}
              label="Metric Type"
              placeholder="Select metric type"
              options={[
                { value: 'count', label: 'Count' },
                { value: 'amount', label: 'Amount' },
                { value: 'percentage', label: 'Percentage' },
                { value: 'duration', label: 'Duration' },
                { value: 'custom', label: 'Custom' }
              ]}
            />
            <TextField 
              fullWidth 
              size="small" 
              label="Value" 
              type="number" 
              InputLabelProps={{ shrink: true }} 
              sx={{ '& .MuiInputBase-root': { height: 40 } }} 
              value={newUsage.metricValue ?? ''} 
              onChange={(e) => setNewUsage(prev => ({ ...prev, metricValue: e.target.value === '' ? undefined : Number(e.target.value) }))} 
            />
            <TextField 
              fullWidth 
              size="small" 
              label="Unit (optional)" 
              InputLabelProps={{ shrink: true }} 
              sx={{ '& .MuiInputBase-root': { height: 40 } }} 
              value={newUsage.unit ?? ''} 
              onChange={(e) => setNewUsage(prev => ({ ...prev, unit: e.target.value }))} 
              placeholder="e.g., users, USD, hours"
            />
          </Box>
          <TextField 
            fullWidth 
            size="small" 
            label="Activity Date" 
            type="date" 
            InputLabelProps={{ shrink: true }} 
            sx={{ '& .MuiInputBase-root': { height: 40 } }} 
            value={newUsage.usageDate ?? ''} 
            onChange={(e) => setNewUsage(prev => ({ ...prev, usageDate: e.target.value }))} 
          />
        </Box>
      </Modal>
    </Box>
  );
};

export default observer(FeaturesTab);
