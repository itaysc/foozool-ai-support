import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Add, Delete, ExpandMore } from '@mui/icons-material';
import { CreateCustomerRequest } from '@/types';

interface CapacityGrowthTabProps {
  formData: CreateCustomerRequest;
  onInputChange: (field: keyof CreateCustomerRequest, value: any) => void;
}

const CapacityGrowthTab: React.FC<CapacityGrowthTabProps> = ({
  formData,
  onInputChange,
}) => {
  const addGrowthProjection = () => {
    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
    if (!newCapacityGrowth.scalingPlans) {
      newCapacityGrowth.scalingPlans = {};
    }
    if (!newCapacityGrowth.scalingPlans.growthProjections) {
      newCapacityGrowth.scalingPlans.growthProjections = [];
    }
    newCapacityGrowth.scalingPlans.growthProjections.push({
      metric: '',
      currentValue: 0,
      projectedValue: 0,
      timeframe: '6months',
      confidence: 'medium'
    });
    onInputChange('capacityGrowth' as any, newCapacityGrowth);
  };

  const updateGrowthProjection = (index: number, field: string, value: any) => {
    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
    if (newCapacityGrowth.scalingPlans?.growthProjections) {
      newCapacityGrowth.scalingPlans.growthProjections[index] = {
        ...newCapacityGrowth.scalingPlans.growthProjections[index],
        [field]: value
      };
      onInputChange('capacityGrowth' as any, newCapacityGrowth);
    }
  };

  const removeGrowthProjection = (index: number) => {
    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
    if (newCapacityGrowth.scalingPlans?.growthProjections) {
      newCapacityGrowth.scalingPlans.growthProjections.splice(index, 1);
      onInputChange('capacityGrowth' as any, newCapacityGrowth);
    }
  };

  const addResourceConstraint = () => {
    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
    if (!newCapacityGrowth.resourceConstraints) {
      newCapacityGrowth.resourceConstraints = [];
    }
    newCapacityGrowth.resourceConstraints.push({
      type: 'budget',
      description: '',
      impact: 'medium',
      resolutionTimeline: undefined
    });
    onInputChange('capacityGrowth' as any, newCapacityGrowth);
  };

  const updateResourceConstraint = (index: number, field: string, value: any) => {
    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
    if (newCapacityGrowth.resourceConstraints) {
      newCapacityGrowth.resourceConstraints[index] = {
        ...newCapacityGrowth.resourceConstraints[index],
        [field]: value
      };
      onInputChange('capacityGrowth' as any, newCapacityGrowth);
    }
  };

  const removeResourceConstraint = (index: number) => {
    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
    if (newCapacityGrowth.resourceConstraints) {
      newCapacityGrowth.resourceConstraints.splice(index, 1);
      onInputChange('capacityGrowth' as any, newCapacityGrowth);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Current Limits Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Current Limits & Usage
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Storage Limits */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>Storage</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Storage Limit"
                  type="number"
                  value={(formData as any).capacityGrowth?.currentLimits?.storage?.limit || ''}
                  onChange={(e) => {
                    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
                    if (!newCapacityGrowth.currentLimits) {
                      newCapacityGrowth.currentLimits = {};
                    }
                    if (!newCapacityGrowth.currentLimits.storage) {
                      newCapacityGrowth.currentLimits.storage = { unit: 'GB' };
                    }
                    const value = e.target.value;
                    newCapacityGrowth.currentLimits.storage.limit = value === '' ? undefined : Number(value);
                    onInputChange('capacityGrowth' as any, newCapacityGrowth);
                  }}
                  placeholder="0"
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Current Usage"
                  type="number"
                  value={(formData as any).capacityGrowth?.currentLimits?.storage?.current || ''}
                  onChange={(e) => {
                    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
                    if (!newCapacityGrowth.currentLimits) {
                      newCapacityGrowth.currentLimits = {};
                    }
                    if (!newCapacityGrowth.currentLimits.storage) {
                      newCapacityGrowth.currentLimits.storage = { unit: 'GB' };
                    }
                    const value = e.target.value;
                    newCapacityGrowth.currentLimits.storage.current = value === '' ? undefined : Number(value);
                    onInputChange('capacityGrowth' as any, newCapacityGrowth);
                  }}
                  placeholder="0"
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={(formData as any).capacityGrowth?.currentLimits?.storage?.unit || 'GB'}
                    onChange={(e) => {
                      const newCapacityGrowth = { ...(formData as any).capacityGrowth };
                      if (!newCapacityGrowth.currentLimits) {
                        newCapacityGrowth.currentLimits = {};
                      }
                      if (!newCapacityGrowth.currentLimits.storage) {
                        newCapacityGrowth.currentLimits.storage = {};
                      }
                      newCapacityGrowth.currentLimits.storage.unit = e.target.value;
                      onInputChange('capacityGrowth' as any, newCapacityGrowth);
                    }}
                    label="Unit"
                  >
                    <MenuItem value="GB">GB</MenuItem>
                    <MenuItem value="TB">TB</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* User Limits */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>Users</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="User Limit"
                  type="number"
                  value={(formData as any).capacityGrowth?.currentLimits?.users?.limit || ''}
                  onChange={(e) => {
                    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
                    if (!newCapacityGrowth.currentLimits) {
                      newCapacityGrowth.currentLimits = {};
                    }
                    if (!newCapacityGrowth.currentLimits.users) {
                      newCapacityGrowth.currentLimits.users = {};
                    }
                    const value = e.target.value;
                    newCapacityGrowth.currentLimits.users.limit = value === '' ? undefined : Number(value);
                    onInputChange('capacityGrowth' as any, newCapacityGrowth);
                  }}
                  placeholder="0"
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Current Users"
                  type="number"
                  value={(formData as any).capacityGrowth?.currentLimits?.users?.current || ''}
                  onChange={(e) => {
                    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
                    if (!newCapacityGrowth.currentLimits) {
                      newCapacityGrowth.currentLimits = {};
                    }
                    if (!newCapacityGrowth.currentLimits.users) {
                      newCapacityGrowth.currentLimits.users = {};
                    }
                    const value = e.target.value;
                    newCapacityGrowth.currentLimits.users.current = value === '' ? undefined : Number(value);
                    onInputChange('capacityGrowth' as any, newCapacityGrowth);
                  }}
                  placeholder="0"
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Projected Growth (%)"
                  type="number"
                  value={(formData as any).capacityGrowth?.currentLimits?.users?.projectedGrowth || ''}
                  onChange={(e) => {
                    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
                    if (!newCapacityGrowth.currentLimits) {
                      newCapacityGrowth.currentLimits = {};
                    }
                    if (!newCapacityGrowth.currentLimits.users) {
                      newCapacityGrowth.currentLimits.users = {};
                    }
                    const value = e.target.value;
                    newCapacityGrowth.currentLimits.users.projectedGrowth = value === '' ? undefined : Number(value);
                    onInputChange('capacityGrowth' as any, newCapacityGrowth);
                  }}
                  placeholder="0"
                />
              </Box>
            </Box>

            {/* Transaction Limits */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>Transactions (Monthly)</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Transaction Limit"
                  type="number"
                  value={(formData as any).capacityGrowth?.currentLimits?.transactions?.limit || ''}
                  onChange={(e) => {
                    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
                    if (!newCapacityGrowth.currentLimits) {
                      newCapacityGrowth.currentLimits = {};
                    }
                    if (!newCapacityGrowth.currentLimits.transactions) {
                      newCapacityGrowth.currentLimits.transactions = {};
                    }
                    const value = e.target.value;
                    newCapacityGrowth.currentLimits.transactions.limit = value === '' ? undefined : Number(value);
                    onInputChange('capacityGrowth' as any, newCapacityGrowth);
                  }}
                  placeholder="0"
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Current Transactions"
                  type="number"
                  value={(formData as any).capacityGrowth?.currentLimits?.transactions?.current || ''}
                  onChange={(e) => {
                    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
                    if (!newCapacityGrowth.currentLimits) {
                      newCapacityGrowth.currentLimits = {};
                    }
                    if (!newCapacityGrowth.currentLimits.transactions) {
                      newCapacityGrowth.currentLimits.transactions = {};
                    }
                    const value = e.target.value;
                    newCapacityGrowth.currentLimits.transactions.current = value === '' ? undefined : Number(value);
                    onInputChange('capacityGrowth' as any, newCapacityGrowth);
                  }}
                  placeholder="0"
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Peak Usage"
                  type="number"
                  value={(formData as any).capacityGrowth?.currentLimits?.transactions?.peakUsage || ''}
                  onChange={(e) => {
                    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
                    if (!newCapacityGrowth.currentLimits) {
                      newCapacityGrowth.currentLimits = {};
                    }
                    if (!newCapacityGrowth.currentLimits.transactions) {
                      newCapacityGrowth.currentLimits.transactions = {};
                    }
                    const value = e.target.value;
                    newCapacityGrowth.currentLimits.transactions.peakUsage = value === '' ? undefined : Number(value);
                    onInputChange('capacityGrowth' as any, newCapacityGrowth);
                  }}
                  placeholder="0"
                />
              </Box>
            </Box>

            {/* API Call Limits */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>API Calls (Monthly)</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="API Call Limit"
                  type="number"
                  value={(formData as any).capacityGrowth?.currentLimits?.apiCalls?.limit || ''}
                  onChange={(e) => {
                    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
                    if (!newCapacityGrowth.currentLimits) {
                      newCapacityGrowth.currentLimits = {};
                    }
                    if (!newCapacityGrowth.currentLimits.apiCalls) {
                      newCapacityGrowth.currentLimits.apiCalls = {};
                    }
                    const value = e.target.value;
                    newCapacityGrowth.currentLimits.apiCalls.limit = value === '' ? undefined : Number(value);
                    onInputChange('capacityGrowth' as any, newCapacityGrowth);
                  }}
                  placeholder="0"
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Current API Calls"
                  type="number"
                  value={(formData as any).capacityGrowth?.currentLimits?.apiCalls?.current || ''}
                  onChange={(e) => {
                    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
                    if (!newCapacityGrowth.currentLimits) {
                      newCapacityGrowth.currentLimits = {};
                    }
                    if (!newCapacityGrowth.currentLimits.apiCalls) {
                      newCapacityGrowth.currentLimits.apiCalls = {};
                    }
                    const value = e.target.value;
                    newCapacityGrowth.currentLimits.apiCalls.current = value === '' ? undefined : Number(value);
                    onInputChange('capacityGrowth' as any, newCapacityGrowth);
                  }}
                  placeholder="0"
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Projected Growth (%)"
                  type="number"
                  value={(formData as any).capacityGrowth?.currentLimits?.apiCalls?.projectedGrowth || ''}
                  onChange={(e) => {
                    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
                    if (!newCapacityGrowth.currentLimits) {
                      newCapacityGrowth.currentLimits = {};
                    }
                    if (!newCapacityGrowth.currentLimits.apiCalls) {
                      newCapacityGrowth.currentLimits.apiCalls = {};
                    }
                    const value = e.target.value;
                    newCapacityGrowth.currentLimits.apiCalls.projectedGrowth = value === '' ? undefined : Number(value);
                    onInputChange('capacityGrowth' as any, newCapacityGrowth);
                  }}
                  placeholder="0"
                />
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Scaling Plans Section */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Scaling Plans
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Next Upgrade */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>Next Planned Upgrade</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Planned Date"
                  type="date"
                  value={(formData as any).capacityGrowth?.scalingPlans?.nextUpgrade?.plannedDate || ''}
                  onChange={(e) => {
                    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
                    if (!newCapacityGrowth.scalingPlans) {
                      newCapacityGrowth.scalingPlans = {};
                    }
                    if (!newCapacityGrowth.scalingPlans.nextUpgrade) {
                      newCapacityGrowth.scalingPlans.nextUpgrade = {};
                    }
                    newCapacityGrowth.scalingPlans.nextUpgrade.plannedDate = e.target.value;
                    onInputChange('capacityGrowth' as any, newCapacityGrowth);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Trigger Metric"
                  value={(formData as any).capacityGrowth?.scalingPlans?.nextUpgrade?.triggerMetric || ''}
                  onChange={(e) => {
                    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
                    if (!newCapacityGrowth.scalingPlans) {
                      newCapacityGrowth.scalingPlans = {};
                    }
                    if (!newCapacityGrowth.scalingPlans.nextUpgrade) {
                      newCapacityGrowth.scalingPlans.nextUpgrade = {};
                    }
                    newCapacityGrowth.scalingPlans.nextUpgrade.triggerMetric = e.target.value;
                    onInputChange('capacityGrowth' as any, newCapacityGrowth);
                  }}
                  placeholder="e.g., storage, users, transactions"
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Trigger Threshold"
                  type="number"
                  value={(formData as any).capacityGrowth?.scalingPlans?.nextUpgrade?.triggerThreshold || ''}
                  onChange={(e) => {
                    const newCapacityGrowth = { ...(formData as any).capacityGrowth };
                    if (!newCapacityGrowth.scalingPlans) {
                      newCapacityGrowth.scalingPlans = {};
                    }
                    if (!newCapacityGrowth.scalingPlans.nextUpgrade) {
                      newCapacityGrowth.scalingPlans.nextUpgrade = {};
                    }
                    const value = e.target.value;
                    newCapacityGrowth.scalingPlans.nextUpgrade.triggerThreshold = value === '' ? undefined : Number(value);
                    onInputChange('capacityGrowth' as any, newCapacityGrowth);
                  }}
                  placeholder="0"
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Upgrade Type</InputLabel>
                  <Select
                    value={(formData as any).capacityGrowth?.scalingPlans?.nextUpgrade?.upgradeType || 'plan_upgrade'}
                    onChange={(e) => {
                      const newCapacityGrowth = { ...(formData as any).capacityGrowth };
                      if (!newCapacityGrowth.scalingPlans) {
                        newCapacityGrowth.scalingPlans = {};
                      }
                      if (!newCapacityGrowth.scalingPlans.nextUpgrade) {
                        newCapacityGrowth.scalingPlans.nextUpgrade = {};
                      }
                      newCapacityGrowth.scalingPlans.nextUpgrade.upgradeType = e.target.value;
                      onInputChange('capacityGrowth' as any, newCapacityGrowth);
                    }}
                    label="Upgrade Type"
                  >
                    <MenuItem value="plan_upgrade">Plan Upgrade</MenuItem>
                    <MenuItem value="addon">Add-on</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Growth Projections */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>Growth Projections</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Projected growth for key metrics
              </Typography>
              
              {(formData as any).capacityGrowth?.scalingPlans?.growthProjections?.map((projection: any, index: number) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
                  <TextField
                    size="small"
                    label="Metric"
                    value={projection.metric || ''}
                    onChange={(e) => updateGrowthProjection(index, 'metric', e.target.value)}
                    placeholder="e.g., users, storage, transactions"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    label="Current Value"
                    type="number"
                    value={projection.currentValue || ''}
                    onChange={(e) => updateGrowthProjection(index, 'currentValue', Number(e.target.value))}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    label="Projected Value"
                    type="number"
                    value={projection.projectedValue || ''}
                    onChange={(e) => updateGrowthProjection(index, 'projectedValue', Number(e.target.value))}
                    sx={{ flex: 1 }}
                  />
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Timeframe</InputLabel>
                    <Select
                      value={projection.timeframe || '6months'}
                      onChange={(e) => updateGrowthProjection(index, 'timeframe', e.target.value)}
                      label="Timeframe"
                    >
                      <MenuItem value="3months">3 Months</MenuItem>
                      <MenuItem value="6months">6 Months</MenuItem>
                      <MenuItem value="1year">1 Year</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Confidence</InputLabel>
                    <Select
                      value={projection.confidence || 'medium'}
                      onChange={(e) => updateGrowthProjection(index, 'confidence', e.target.value)}
                      label="Confidence"
                    >
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="low">Low</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton 
                    onClick={() => removeGrowthProjection(index)}
                    color="error"
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              )) || []}
              
              <Button
                startIcon={<Add />}
                onClick={addGrowthProjection}
                variant="outlined"
                size="small"
                sx={{ alignSelf: 'flex-start' }}
              >
                Add Growth Projection
              </Button>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Resource Constraints Section */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Resource Constraints
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Known constraints that might limit growth or success
            </Typography>
            
            {(formData as any).capacityGrowth?.resourceConstraints?.map((constraint: any, index: number) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={constraint.type || 'budget'}
                    onChange={(e) => updateResourceConstraint(index, 'type', e.target.value)}
                    label="Type"
                  >
                    <MenuItem value="budget">Budget</MenuItem>
                    <MenuItem value="technical">Technical</MenuItem>
                    <MenuItem value="personnel">Personnel</MenuItem>
                    <MenuItem value="time">Time</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="Description"
                  value={constraint.description || ''}
                  onChange={(e) => updateResourceConstraint(index, 'description', e.target.value)}
                  placeholder="Describe the constraint"
                  sx={{ flex: 2 }}
                />
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Impact</InputLabel>
                  <Select
                    value={constraint.impact || 'medium'}
                    onChange={(e) => updateResourceConstraint(index, 'impact', e.target.value)}
                    label="Impact"
                  >
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="Resolution Timeline"
                  type="date"
                  value={constraint.resolutionTimeline || ''}
                  onChange={(e) => updateResourceConstraint(index, 'resolutionTimeline', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: 1 }}
                />
                <IconButton 
                  onClick={() => removeResourceConstraint(index)}
                  color="error"
                  size="small"
                >
                  <Delete />
                </IconButton>
              </Box>
            )) || []}
            
            <Button
              startIcon={<Add />}
              onClick={addResourceConstraint}
              variant="outlined"
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            >
              Add Resource Constraint
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default CapacityGrowthTab;
