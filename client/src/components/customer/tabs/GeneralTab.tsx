import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Help,
} from '@mui/icons-material';
import { CreateCustomerRequest } from '@/types';
import SelectBase from '@/components/base/Select';
import industriesStore from '@/stores/industries.store';

interface FormErrors {
  name?: string;
  industry?: string;
  companySize?: string;
  startDate?: string;
  accountManager?: string;
  healthScore?: string;
  notes?: string;
}

interface GeneralTabProps {
  formData: CreateCustomerRequest;
  errors: FormErrors;
  onInputChange: (field: keyof CreateCustomerRequest, value: any) => void;
}

const companySizeOptions = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
];

const healthScoreOptions = [
  { value: 1, label: '1 - Critical' },
  { value: 2, label: '2 - Poor' },
  { value: 3, label: '3 - Fair' },
  { value: 4, label: '4 - Below Average' },
  { value: 5, label: '5 - Average' },
  { value: 6, label: '6 - Above Average' },
  { value: 7, label: '7 - Good' },
  { value: 8, label: '8 - Very Good' },
  { value: 9, label: '9 - Excellent' },
  { value: 10, label: '10 - Outstanding' },
];

const GeneralTab: React.FC<GeneralTabProps> = ({
  formData,
  errors,
  onInputChange,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Customer Information Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
          Customer Information
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Customer Name *"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            required
            placeholder="Enter customer company name"
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
          <SelectBase
            value={formData.industry}
            onChange={(value) => onInputChange('industry', value as string)}
            size="small"
            fullWidth
            label="Industry"
            placeholder="Select industry"
            allowOther
            allowClear
            searchable
            options={industriesStore.industries.length ? industriesStore.industries : []}
          />
          <SelectBase
            value={(formData as any).segment || ''}
            onChange={(v) => onInputChange('segment' as any, v as any)}
            size="small"
            fullWidth
            label="Customer Segment"
            placeholder="Select segment"
            allowClear
            options={['SMB', 'Mid-Market', 'Enterprise', 'Other']}
          />
        </Box>
      </Box>

      {/* Company Details Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
          Company Details
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Company Size</InputLabel>
            <Select
              value={formData.companySize || ''}
              onChange={(e) => onInputChange('companySize', e.target.value)}
              label="Company Size"
              sx={{ height: 40 }}
            >
              <MenuItem value="">
                <em>Select company size</em>
              </MenuItem>
              {companySizeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Relationship Details Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
          Relationship Details
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => onInputChange('startDate', e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
        </Box>
      </Box>


      {/* Usage Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
          Usage
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Active Users Count"
            type="number"
            value={(formData as any).usageData?.activeUsersCount || ''}
            onChange={(e) => onInputChange('usageData' as any, { ...(formData as any).usageData, activeUsersCount: e.target.value === '' ? undefined : Number(e.target.value) })}
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
          <TextField
            fullWidth
            size="small"
            label="Seats Purchased"
            type="number"
            value={(formData as any).usageData?.seatsPurchased || ''}
            onChange={(e) => onInputChange('usageData' as any, { ...(formData as any).usageData, seatsPurchased: e.target.value === '' ? undefined : Number(e.target.value) })}
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
          <TextField
            fullWidth
            size="small"
            label="Seats Used"
            type="number"
            value={(formData as any).usageData?.seatsUsed || ''}
            onChange={(e) => onInputChange('usageData' as any, { ...(formData as any).usageData, seatsUsed: e.target.value === '' ? undefined : Number(e.target.value) })}
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
        </Box>
      </Box>

      {/* Notes Section */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
            Additional Notes
          </Typography>
          <Tooltip title="This data is important in order to generate quality insights" arrow>
            <IconButton size="small" sx={{ ml: 1, p: 0.5 }}>
              <Help fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <TextField
          fullWidth
          size="small"
          label="Notes"
          multiline
          rows={3}
          value={formData.notes}
          onChange={(e) => onInputChange('notes', e.target.value)}
          placeholder="Additional notes about the customer..."
          sx={{ '& .MuiInputBase-root': { minHeight: 40 } }}
        />
      </Box>

    </Box>
  );
};

export default GeneralTab;
