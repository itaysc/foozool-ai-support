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

interface SuccessMetricsTabProps {
  formData: CreateCustomerRequest;
  onInputChange: (field: keyof CreateCustomerRequest, value: any) => void;
}

const SuccessMetricsTab: React.FC<SuccessMetricsTabProps> = ({
  formData,
  onInputChange,
}) => {
  const addPrimaryMetric = () => {
    const newSuccessCriteria = { ...(formData as any).successCriteria };
    if (!newSuccessCriteria.primaryMetrics) {
      newSuccessCriteria.primaryMetrics = [];
    }
    newSuccessCriteria.primaryMetrics.push({
      name: '',
      currentValue: 0,
      targetValue: 0,
      unit: '',
      importance: 'medium'
    });
    onInputChange('successCriteria' as any, newSuccessCriteria);
  };

  const updatePrimaryMetric = (index: number, field: string, value: any) => {
    const newSuccessCriteria = { ...(formData as any).successCriteria };
    if (newSuccessCriteria.primaryMetrics) {
      newSuccessCriteria.primaryMetrics[index] = {
        ...newSuccessCriteria.primaryMetrics[index],
        [field]: value
      };
      onInputChange('successCriteria' as any, newSuccessCriteria);
    }
  };

  const removePrimaryMetric = (index: number) => {
    const newSuccessCriteria = { ...(formData as any).successCriteria };
    if (newSuccessCriteria.primaryMetrics) {
      newSuccessCriteria.primaryMetrics.splice(index, 1);
      onInputChange('successCriteria' as any, newSuccessCriteria);
    }
  };

  const addKPI = () => {
    const newSuccessCriteria = { ...(formData as any).successCriteria };
    if (!newSuccessCriteria.kpis) {
      newSuccessCriteria.kpis = [];
    }
    newSuccessCriteria.kpis.push({
      name: '',
      currentValue: 0,
      targetValue: 0,
      unit: '',
      measurementPeriod: 'monthly'
    });
    onInputChange('successCriteria' as any, newSuccessCriteria);
  };

  const updateKPI = (index: number, field: string, value: any) => {
    const newSuccessCriteria = { ...(formData as any).successCriteria };
    if (newSuccessCriteria.kpis) {
      newSuccessCriteria.kpis[index] = {
        ...newSuccessCriteria.kpis[index],
        [field]: value
      };
      onInputChange('successCriteria' as any, newSuccessCriteria);
    }
  };

  const removeKPI = (index: number) => {
    const newSuccessCriteria = { ...(formData as any).successCriteria };
    if (newSuccessCriteria.kpis) {
      newSuccessCriteria.kpis.splice(index, 1);
      onInputChange('successCriteria' as any, newSuccessCriteria);
    }
  };

  const addCustomSatisfactionMetric = () => {
    const newSuccessCriteria = { ...(formData as any).successCriteria };
    if (!newSuccessCriteria.satisfactionBenchmarks) {
      newSuccessCriteria.satisfactionBenchmarks = {};
    }
    if (!newSuccessCriteria.satisfactionBenchmarks.customMetrics) {
      newSuccessCriteria.satisfactionBenchmarks.customMetrics = [];
    }
    newSuccessCriteria.satisfactionBenchmarks.customMetrics.push({
      name: '',
      current: 0,
      target: 0,
      scale: '',
      lastUpdated: new Date().toISOString()
    });
    onInputChange('successCriteria' as any, newSuccessCriteria);
  };

  const updateCustomSatisfactionMetric = (index: number, field: string, value: any) => {
    const newSuccessCriteria = { ...(formData as any).successCriteria };
    if (newSuccessCriteria.satisfactionBenchmarks?.customMetrics) {
      newSuccessCriteria.satisfactionBenchmarks.customMetrics[index] = {
        ...newSuccessCriteria.satisfactionBenchmarks.customMetrics[index],
        [field]: value
      };
      onInputChange('successCriteria' as any, newSuccessCriteria);
    }
  };

  const removeCustomSatisfactionMetric = (index: number) => {
    const newSuccessCriteria = { ...(formData as any).successCriteria };
    if (newSuccessCriteria.satisfactionBenchmarks?.customMetrics) {
      newSuccessCriteria.satisfactionBenchmarks.customMetrics.splice(index, 1);
      onInputChange('successCriteria' as any, newSuccessCriteria);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Primary Metrics Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Primary Business Metrics
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Key business metrics that define customer success
            </Typography>
            
            {(formData as any).successCriteria?.primaryMetrics?.map((metric: any, index: number) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <TextField
                  size="small"
                  label="Metric Name"
                  value={metric.name || ''}
                  onChange={(e) => updatePrimaryMetric(index, 'name', e.target.value)}
                  placeholder="e.g., Revenue Growth, User Adoption"
                  sx={{ flex: 2 }}
                />
                <TextField
                  size="small"
                  label="Current Value"
                  type="number"
                  value={metric.currentValue || ''}
                  onChange={(e) => updatePrimaryMetric(index, 'currentValue', Number(e.target.value))}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="Target Value"
                  type="number"
                  value={metric.targetValue || ''}
                  onChange={(e) => updatePrimaryMetric(index, 'targetValue', Number(e.target.value))}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="Unit"
                  value={metric.unit || ''}
                  onChange={(e) => updatePrimaryMetric(index, 'unit', e.target.value)}
                  placeholder="%, $, users"
                  sx={{ flex: 1 }}
                />
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Importance</InputLabel>
                  <Select
                    value={metric.importance || 'medium'}
                    onChange={(e) => updatePrimaryMetric(index, 'importance', e.target.value)}
                    label="Importance"
                  >
                    <MenuItem value="critical">Critical</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
                <IconButton 
                  onClick={() => removePrimaryMetric(index)}
                  color="error"
                  size="small"
                >
                  <Delete />
                </IconButton>
              </Box>
            )) || []}
            
            <Button
              startIcon={<Add />}
              onClick={addPrimaryMetric}
              variant="outlined"
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            >
              Add Primary Metric
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* KPIs Section */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Key Performance Indicators
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Measurable KPIs with specific timeframes
            </Typography>
            
            {(formData as any).successCriteria?.kpis?.map((kpi: any, index: number) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <TextField
                  size="small"
                  label="KPI Name"
                  value={kpi.name || ''}
                  onChange={(e) => updateKPI(index, 'name', e.target.value)}
                  placeholder="e.g., Support Response Time, Feature Usage"
                  sx={{ flex: 2 }}
                />
                <TextField
                  size="small"
                  label="Current Value"
                  type="number"
                  value={kpi.currentValue || ''}
                  onChange={(e) => updateKPI(index, 'currentValue', Number(e.target.value))}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="Target Value"
                  type="number"
                  value={kpi.targetValue || ''}
                  onChange={(e) => updateKPI(index, 'targetValue', Number(e.target.value))}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="Unit"
                  value={kpi.unit || ''}
                  onChange={(e) => updateKPI(index, 'unit', e.target.value)}
                  placeholder="hours, %, count"
                  sx={{ flex: 1 }}
                />
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Period</InputLabel>
                  <Select
                    value={kpi.measurementPeriod || 'monthly'}
                    onChange={(e) => updateKPI(index, 'measurementPeriod', e.target.value)}
                    label="Period"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                    <MenuItem value="annually">Annually</MenuItem>
                  </Select>
                </FormControl>
                <IconButton 
                  onClick={() => removeKPI(index)}
                  color="error"
                  size="small"
                >
                  <Delete />
                </IconButton>
              </Box>
            )) || []}
            
            <Button
              startIcon={<Add />}
              onClick={addKPI}
              variant="outlined"
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            >
              Add KPI
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Custom Satisfaction Metrics Section */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Custom Satisfaction Metrics
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Additional satisfaction metrics beyond NPS and CSAT
            </Typography>
            
            {(formData as any).successCriteria?.satisfactionBenchmarks?.customMetrics?.map((metric: any, index: number) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <TextField
                  size="small"
                  label="Metric Name"
                  value={metric.name || ''}
                  onChange={(e) => updateCustomSatisfactionMetric(index, 'name', e.target.value)}
                  placeholder="e.g., Product Satisfaction, Implementation Success"
                  sx={{ flex: 2 }}
                />
                <TextField
                  size="small"
                  label="Current Score"
                  type="number"
                  value={metric.current || ''}
                  onChange={(e) => updateCustomSatisfactionMetric(index, 'current', Number(e.target.value))}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="Target Score"
                  type="number"
                  value={metric.target || ''}
                  onChange={(e) => updateCustomSatisfactionMetric(index, 'target', Number(e.target.value))}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="Scale"
                  value={metric.scale || ''}
                  onChange={(e) => updateCustomSatisfactionMetric(index, 'scale', e.target.value)}
                  placeholder="e.g., 1-10, 1-5, 0-100%"
                  sx={{ flex: 1 }}
                />
                <IconButton 
                  onClick={() => removeCustomSatisfactionMetric(index)}
                  color="error"
                  size="small"
                >
                  <Delete />
                </IconButton>
              </Box>
            )) || []}
            
            <Button
              startIcon={<Add />}
              onClick={addCustomSatisfactionMetric}
              variant="outlined"
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            >
              Add Custom Metric
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default SuccessMetricsTab;
