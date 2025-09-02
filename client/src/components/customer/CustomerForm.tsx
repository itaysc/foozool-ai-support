import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Cancel,
  Business,
  Person,
  Assessment,
  AttachMoney,
  CalendarToday,
  Notes,
  Edit,
  Help
} from '@mui/icons-material';
import { observer } from 'mobx-react';
import { ICustomer, CreateCustomerRequest, UpdateCustomerRequest } from '@/types';
import customersStore from '@/stores/customers.store';
import IndustrySelect from './IndustrySelect';

interface CustomerFormProps {
  mode: 'create' | 'edit';
}

interface FormErrors {
  name?: string;
  industry?: string;
  companySize?: string;
  contractValue?: string;
  startDate?: string;
  accountManager?: string;
  healthScore?: string;
  notes?: string;
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

const CustomerForm: React.FC<CustomerFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    industry: '',
    companySize: undefined,
    contractValue: undefined,
    startDate: '',
    accountManager: '',
    healthScore: undefined,
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (mode === 'edit' && customerId) {
      fetchCustomer();
    }
  }, [mode, customerId]);

  const fetchCustomer = async () => {
    if (!customerId) return;
    
    try {
      await customersStore.fetchCustomerById(customerId);
      const customerData = customersStore.currentCustomer;
      if (customerData) {
        setCustomer(customerData);
        setFormData({
          name: customerData.name,
          industry: customerData.industry || '',
          companySize: customerData.companySize,
          contractValue: customerData.contractValue,
          startDate: customerData.startDate ? customerData.startDate.split('T')[0] : '',
          accountManager: customerData.accountManager || '',
          healthScore: customerData.healthScore,
          notes: customerData.notes || '',
        });
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }

    if (formData.healthScore !== undefined && (formData.healthScore < 1 || formData.healthScore > 10)) {
      newErrors.healthScore = 'Health score must be between 1 and 10';
    }

    if (formData.contractValue !== undefined && formData.contractValue < 0) {
      newErrors.contractValue = 'Contract value cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'create') {
        await customersStore.createCustomer(formData);
      } else if (customerId) {
        await customersStore.updateCustomer(customerId, formData);
      }
      
      navigate('/customers');
    } catch (err: any) {
      console.error('Error saving customer:', err);
    }
  };

  const handleInputChange = (field: keyof CreateCustomerRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined as any }));
    }
  };

  if (customersStore.isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

    return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/customers')}
          variant="text"
          sx={{ mb: 2, color: 'text.secondary', p: 0 }}
        >
          Back to Customers
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
          {mode === 'create' ? 'Add New Customer' : 'Edit Customer'}
        </Typography>
      </Box>

      {customersStore.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {customersStore.error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
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
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                  placeholder="Enter customer company name"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />
                <IndustrySelect
                  value={formData.industry}
                  onChange={(value) => handleInputChange('industry', value)}
                  size="small"
                  fullWidth
                  label="Industry"
                  placeholder="Select industry"
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
                    onChange={(e) => handleInputChange('companySize', e.target.value)}
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
                <TextField
                  fullWidth
                  size="small"
                  label="Contract Value (USD)"
                  type="number"
                  value={formData.contractValue || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      handleInputChange('contractValue', undefined);
                    } else {
                      const numValue = Number(value);
                      if (!isNaN(numValue)) {
                        handleInputChange('contractValue', numValue);
                      }
                    }
                  }}
                  error={!!errors.contractValue}
                  helperText={errors.contractValue}
                  placeholder="0"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />
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
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Account Manager"
                  value={formData.accountManager}
                  onChange={(e) => handleInputChange('accountManager', e.target.value)}
                  placeholder="Name of the account manager"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />
              </Box>
            </Box>

            {/* Health Assessment Section */}
            <Box>
              <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
                Health Assessment
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Health Score</InputLabel>
                  <Select
                    value={formData.healthScore?.toString() || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        handleInputChange('healthScore', undefined);
                      } else {
                        const numValue = Number(value);
                        if (!isNaN(numValue)) {
                          handleInputChange('healthScore', numValue);
                        }
                      }
                    }}
                    label="Health Score"
                    error={!!errors.healthScore}
                    sx={{ height: 40 }}
                  >
                    <MenuItem value="">
                      <em>Select health score</em>
                    </MenuItem>
                    {healthScoreOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.healthScore && (
                    <FormHelperText error>{errors.healthScore}</FormHelperText>
                  )}
                </FormControl>
                <Box sx={{ flex: 1 }} /> {/* Empty space to maintain layout */}
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
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about the customer..."
                sx={{ '& .MuiInputBase-root': { minHeight: 40 } }}
              />
            </Box>

            {/* Action Buttons */}
            <Box sx={{ pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={() => navigate('/customers')}
                  disabled={customersStore.isSaving}
                  size="medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={customersStore.isSaving ? <CircularProgress size={20} /> : <Save />}
                  disabled={customersStore.isSaving}
                  size="medium"
                >
                  {customersStore.isSaving ? 'Saving...' : mode === 'create' ? 'Create Customer' : 'Update Customer'}
                </Button>
              </Stack>
            </Box>
          </Box>
        </form>
    </Box>
  );
};

export default observer(CustomerForm);
