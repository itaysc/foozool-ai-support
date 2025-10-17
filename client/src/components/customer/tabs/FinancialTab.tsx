import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { CreateCustomerRequest } from '@/types';

interface FinancialTabProps {
  formData: CreateCustomerRequest;
  onInputChange: (field: keyof CreateCustomerRequest, value: any) => void;
}

const FinancialTab: React.FC<FinancialTabProps> = ({
  formData,
  onInputChange,
}) => {
  const handleFinancialInputChange = (field: string, value: any) => {
    const newFinancialMetrics = { ...(formData as any).financialMetrics };
    newFinancialMetrics[field] = value;
    onInputChange('financialMetrics' as any, newFinancialMetrics);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Revenue Metrics Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
          Revenue Metrics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Annual Recurring Revenue (ARR)"
            type="number"
            value={(formData as any).financialMetrics?.annualRecurringRevenue || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                handleFinancialInputChange('annualRecurringRevenue', undefined);
              } else {
                const numValue = Number(value);
                if (!isNaN(numValue)) {
                  handleFinancialInputChange('annualRecurringRevenue', numValue);
                }
              }
            }}
            placeholder="0"
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
          <TextField
            fullWidth
            size="small"
            label="Monthly Recurring Revenue (MRR)"
            type="number"
            value={(formData as any).financialMetrics?.monthlyRecurringRevenue || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                handleFinancialInputChange('monthlyRecurringRevenue', undefined);
              } else {
                const numValue = Number(value);
                if (!isNaN(numValue)) {
                  handleFinancialInputChange('monthlyRecurringRevenue', numValue);
                }
              }
            }}
            placeholder="0"
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
          <TextField
            fullWidth
            size="small"
            label="Contract Value (USD)"
            type="number"
            value={(formData as any).financialMetrics?.contractValue || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                handleFinancialInputChange('contractValue', undefined);
              } else {
                const numValue = Number(value);
                if (!isNaN(numValue)) {
                  handleFinancialInputChange('contractValue', numValue);
                }
              }
            }}
            placeholder="0"
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
        </Box>
      </Box>

      {/* Contract & Payment Terms Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
          Contract & Payment Terms
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Contract Renewal Date"
            type="date"
            value={(formData as any).financialMetrics?.contractRenewalDate || ''}
            onChange={(e) => handleFinancialInputChange('contractRenewalDate', e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Payment Terms</InputLabel>
            <Select
              value={(formData as any).financialMetrics?.paymentTerms || 'net30'}
              onChange={(e) => handleFinancialInputChange('paymentTerms', e.target.value)}
              label="Payment Terms"
              sx={{ height: 40 }}
            >
              <MenuItem value="net15">Net 15</MenuItem>
              <MenuItem value="net30">Net 30</MenuItem>
              <MenuItem value="net60">Net 60</MenuItem>
              <MenuItem value="net90">Net 90</MenuItem>
              <MenuItem value="prepaid">Prepaid</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="annual">Annual</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Payment Reliability</InputLabel>
            <Select
              value={(formData as any).financialMetrics?.paymentReliability || 'good'}
              onChange={(e) => handleFinancialInputChange('paymentReliability', e.target.value)}
              label="Payment Reliability"
              sx={{ height: 40 }}
            >
              <MenuItem value="excellent">Excellent</MenuItem>
              <MenuItem value="good">Good</MenuItem>
              <MenuItem value="fair">Fair</MenuItem>
              <MenuItem value="poor">Poor</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Payment History Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
          Payment Information
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Last Payment Date"
            type="date"
            value={(formData as any).financialMetrics?.lastPaymentDate || ''}
            onChange={(e) => handleFinancialInputChange('lastPaymentDate', e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
          <TextField
            fullWidth
            size="small"
            label="Outstanding Balance (USD)"
            type="number"
            value={(formData as any).financialMetrics?.outstandingBalance || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                handleFinancialInputChange('outstandingBalance', 0);
              } else {
                const numValue = Number(value);
                if (!isNaN(numValue)) {
                  handleFinancialInputChange('outstandingBalance', numValue);
                }
              }
            }}
            placeholder="0"
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
          <TextField
            fullWidth
            size="small"
            label="Average Payment Days"
            type="number"
            value={(formData as any).financialMetrics?.averagePaymentDays || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                handleFinancialInputChange('averagePaymentDays', undefined);
              } else {
                const numValue = Number(value);
                if (!isNaN(numValue)) {
                  handleFinancialInputChange('averagePaymentDays', numValue);
                }
              }
            }}
            placeholder="0"
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
        </Box>
      </Box>

      {/* Credit Score Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
          Credit Assessment
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Credit Score"
            type="number"
            value={(formData as any).financialMetrics?.creditScore || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                handleFinancialInputChange('creditScore', undefined);
              } else {
                const numValue = Number(value);
                if (!isNaN(numValue) && numValue >= 300 && numValue <= 850) {
                  handleFinancialInputChange('creditScore', numValue);
                }
              }
            }}
            placeholder="300-850"
            inputProps={{ min: 300, max: 850 }}
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
          <Box sx={{ flex: 2 }} /> {/* Empty space to maintain layout */}
        </Box>
      </Box>

    </Box>
  );
};

export default FinancialTab;
