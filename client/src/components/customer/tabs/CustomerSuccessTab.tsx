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

interface CustomerSuccessTabProps {
  formData: CreateCustomerRequest;
  onInputChange: (field: keyof CreateCustomerRequest, value: any) => void;
}

const CustomerSuccessTab: React.FC<CustomerSuccessTabProps> = ({
  formData,
  onInputChange,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Health Score Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
          Customer Health
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Health Score"
            type="number"
            value={formData.healthScore || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                onInputChange('healthScore', undefined);
              } else {
                const numValue = Number(value);
                if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
                  onInputChange('healthScore', numValue);
                }
              }
            }}
            placeholder="1-10"
            inputProps={{ min: 1, max: 10 }}
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
          <TextField
            fullWidth
            size="small"
            label="Account Manager"
            value={formData.accountManager || ''}
            onChange={(e) => onInputChange('accountManager', e.target.value)}
            placeholder="Account manager name"
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
          <Box sx={{ flex: 1 }} /> {/* Empty space to maintain layout */}
        </Box>
      </Box>

      {/* Success Criteria Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
          Success Criteria & KPIs
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Success Definition"
            multiline
            rows={3}
            value={(formData as any).successCriteria?.successDefinition || ''}
            onChange={(e) => {
              const newSuccessCriteria = { ...(formData as any).successCriteria };
              newSuccessCriteria.successDefinition = e.target.value;
              onInputChange('successCriteria' as any, newSuccessCriteria);
            }}
            placeholder="How does this customer measure success with our solution?"
            sx={{ '& .MuiInputBase-root': { height: 'auto' } }}
          />
          
          {/* NPS Section */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Current NPS"
              type="number"
              value={(formData as any).successCriteria?.satisfactionBenchmarks?.nps?.current || ''}
              onChange={(e) => {
                const newSuccessCriteria = { ...(formData as any).successCriteria };
                if (!newSuccessCriteria.satisfactionBenchmarks) {
                  newSuccessCriteria.satisfactionBenchmarks = {};
                }
                if (!newSuccessCriteria.satisfactionBenchmarks.nps) {
                  newSuccessCriteria.satisfactionBenchmarks.nps = {};
                }
                const value = e.target.value;
                newSuccessCriteria.satisfactionBenchmarks.nps.current = value === '' ? undefined : Number(value);
                onInputChange('successCriteria' as any, newSuccessCriteria);
              }}
              placeholder="-100 to 100"
              inputProps={{ min: -100, max: 100 }}
              sx={{ '& .MuiInputBase-root': { height: 40 } }}
            />
            <TextField
              fullWidth
              size="small"
              label="Target NPS"
              type="number"
              value={(formData as any).successCriteria?.satisfactionBenchmarks?.nps?.target || ''}
              onChange={(e) => {
                const newSuccessCriteria = { ...(formData as any).successCriteria };
                if (!newSuccessCriteria.satisfactionBenchmarks) {
                  newSuccessCriteria.satisfactionBenchmarks = {};
                }
                if (!newSuccessCriteria.satisfactionBenchmarks.nps) {
                  newSuccessCriteria.satisfactionBenchmarks.nps = {};
                }
                const value = e.target.value;
                newSuccessCriteria.satisfactionBenchmarks.nps.target = value === '' ? undefined : Number(value);
                onInputChange('successCriteria' as any, newSuccessCriteria);
              }}
              placeholder="-100 to 100"
              inputProps={{ min: -100, max: 100 }}
              sx={{ '& .MuiInputBase-root': { height: 40 } }}
            />
          </Box>

          {/* CSAT Section */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Current CSAT"
              type="number"
              value={(formData as any).successCriteria?.satisfactionBenchmarks?.csat?.current || ''}
              onChange={(e) => {
                const newSuccessCriteria = { ...(formData as any).successCriteria };
                if (!newSuccessCriteria.satisfactionBenchmarks) {
                  newSuccessCriteria.satisfactionBenchmarks = {};
                }
                if (!newSuccessCriteria.satisfactionBenchmarks.csat) {
                  newSuccessCriteria.satisfactionBenchmarks.csat = {};
                }
                const value = e.target.value;
                newSuccessCriteria.satisfactionBenchmarks.csat.current = value === '' ? undefined : Number(value);
                onInputChange('successCriteria' as any, newSuccessCriteria);
              }}
              placeholder="1-5"
              inputProps={{ min: 1, max: 5 }}
              sx={{ '& .MuiInputBase-root': { height: 40 } }}
            />
            <TextField
              fullWidth
              size="small"
              label="Target CSAT"
              type="number"
              value={(formData as any).successCriteria?.satisfactionBenchmarks?.csat?.target || ''}
              onChange={(e) => {
                const newSuccessCriteria = { ...(formData as any).successCriteria };
                if (!newSuccessCriteria.satisfactionBenchmarks) {
                  newSuccessCriteria.satisfactionBenchmarks = {};
                }
                if (!newSuccessCriteria.satisfactionBenchmarks.csat) {
                  newSuccessCriteria.satisfactionBenchmarks.csat = {};
                }
                const value = e.target.value;
                newSuccessCriteria.satisfactionBenchmarks.csat.target = value === '' ? undefined : Number(value);
                onInputChange('successCriteria' as any, newSuccessCriteria);
              }}
              placeholder="1-5"
              inputProps={{ min: 1, max: 5 }}
              sx={{ '& .MuiInputBase-root': { height: 40 } }}
            />
          </Box>
        </Box>
      </Box>

    </Box>
  );
};

export default CustomerSuccessTab;
