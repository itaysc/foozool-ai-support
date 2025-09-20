import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Stack,
  Typography,
  Divider,
} from '@mui/material';
import {
  Save,
  Cancel,
  ArrowBack,
} from '@mui/icons-material';
import { observer } from 'mobx-react';
import { StakeholderData } from '@/services/stakeholders-service';
import toast from '@/utils/toast';

interface StakeholderFormProps {
  mode: 'create' | 'edit';
  customerId: string;
  stakeholderId?: string;
  initialData?: StakeholderData;
  onSave: (data: StakeholderData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormErrors {
  name?: string;
  title?: string;
  department?: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  teamSize?: string;
  decisionPower?: string;
  adoptionInfluence?: string;
  usageRate?: string;
}

const stakeholderTypeOptions = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'technical', label: 'Technical' },
  { value: 'business', label: 'Business' },
];

const engagementLevelOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'inactive', label: 'Inactive' },
];

const StakeholderForm: React.FC<StakeholderFormProps> = ({
  mode,
  customerId,
  stakeholderId,
  initialData,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  console.log('🔄 StakeholderForm: Component rendered with mode:', mode, 'customerId:', customerId);
  const [formData, setFormData] = useState<StakeholderData>({
    name: '',
    title: '',
    department: '',
    role: '',
    stakeholderType: 'secondary',
    contact: {
      email: '',
      phone: '',
      linkedin: '',
    },
    engagement: {
      level: 'medium',
      usageRate: 0,
    },
    influence: {
      teamSize: 0,
      decisionPower: 5,
      adoptionInfluence: 5,
    },
    notes: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.role.trim()) {
      newErrors.role = 'Role is required';
    }

    if (!formData.contact.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.contact.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.contact.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (formData.influence?.teamSize !== undefined && formData.influence.teamSize < 0) {
      newErrors.teamSize = 'Team size cannot be negative';
    }

    if (formData.influence?.decisionPower !== undefined && (formData.influence.decisionPower < 1 || formData.influence.decisionPower > 10)) {
      newErrors.decisionPower = 'Decision power must be between 1 and 10';
    }

    if (formData.influence?.adoptionInfluence !== undefined && (formData.influence.adoptionInfluence < 1 || formData.influence.adoptionInfluence > 10)) {
      newErrors.adoptionInfluence = 'Adoption influence must be between 1 and 10';
    }

    if (formData.engagement?.usageRate !== undefined && (formData.engagement.usageRate < 0 || formData.engagement.usageRate > 100)) {
      newErrors.usageRate = 'Usage rate must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('🔄 StakeholderForm: handleSubmit called with formData:', formData);
    
    if (!validateForm()) {
      console.log('🔄 StakeholderForm: Form validation failed');
      return;
    }

    console.log('🔄 StakeholderForm: Form validation passed, calling onSave');
    try {
      await onSave(formData);
      console.log('🔄 StakeholderForm: onSave completed successfully');
      toast.success(`Stakeholder ${mode === 'create' ? 'created' : 'updated'} successfully`);
    } catch (err: any) {
      console.error('Error saving stakeholder:', err);
      toast.error('Failed to save stakeholder. Please try again.');
    }
  };

  const handleInputChange = (field: keyof StakeholderData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined as any }));
    }
  };

  const handleContactChange = (field: keyof StakeholderData['contact'], value: string) => {
    setFormData(prev => ({
      ...prev,
      contact: { ...prev.contact, [field]: value }
    }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined as any }));
    }
  };

  const handleEngagementChange = (field: keyof StakeholderData['engagement'], value: any) => {
    setFormData(prev => ({
      ...prev,
      engagement: { ...prev.engagement, [field]: value }
    }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined as any }));
    }
  };

  const handleInfluenceChange = (field: keyof StakeholderData['influence'], value: any) => {
    setFormData(prev => ({
      ...prev,
      influence: { ...prev.influence, [field]: value }
    }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined as any }));
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={onCancel}
          variant="text"
          sx={{ mb: 2, color: 'text.secondary', p: 0 }}
        >
          Back to Stakeholders
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
          {mode === 'create' ? 'Add New Stakeholder' : 'Edit Stakeholder'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Basic Information Section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
              Basic Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Name *"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                  placeholder="Enter stakeholder name"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Title *"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  error={!!errors.title}
                  helperText={errors.title}
                  required
                  placeholder="Enter job title"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Department *"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  error={!!errors.department}
                  helperText={errors.department}
                  required
                  placeholder="Enter department"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Role *"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  error={!!errors.role}
                  helperText={errors.role}
                  required
                  placeholder="Enter role"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Stakeholder Type</InputLabel>
                  <Select
                    value={formData.stakeholderType || 'secondary'}
                    onChange={(e) => handleInputChange('stakeholderType', e.target.value)}
                    label="Stakeholder Type"
                    sx={{ height: 40 }}
                  >
                    {stakeholderTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Contact Information Section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
              Contact Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email *"
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                  placeholder="Enter email address"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Phone"
                  value={formData.contact.phone || ''}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  placeholder="Enter phone number"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />
              </Box>
              <TextField
                fullWidth
                size="small"
                label="LinkedIn Profile"
                value={formData.contact.linkedin || ''}
                onChange={(e) => handleContactChange('linkedin', e.target.value)}
                placeholder="Enter LinkedIn profile URL"
                sx={{ '& .MuiInputBase-root': { height: 40 } }}
              />
            </Box>
          </Box>

          <Divider />

          {/* Engagement Section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
              Engagement
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Engagement Level</InputLabel>
                <Select
                  value={formData.engagement?.level || 'medium'}
                  onChange={(e) => handleEngagementChange('level', e.target.value)}
                  label="Engagement Level"
                  sx={{ height: 40 }}
                >
                  {engagementLevelOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                size="small"
                label="Usage Rate (%)"
                type="number"
                value={formData.engagement?.usageRate || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleEngagementChange('usageRate', undefined);
                  } else {
                    const numValue = Number(value);
                    if (!isNaN(numValue)) {
                      handleEngagementChange('usageRate', numValue);
                    }
                  }
                }}
                error={!!errors.usageRate}
                helperText={errors.usageRate}
                placeholder="0-100"
                sx={{ '& .MuiInputBase-root': { height: 40 } }}
              />
            </Box>
          </Box>

          <Divider />

          {/* Influence Section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
              Influence & Impact
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Team Size"
                type="number"
                value={formData.influence?.teamSize || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleInfluenceChange('teamSize', undefined);
                  } else {
                    const numValue = Number(value);
                    if (!isNaN(numValue)) {
                      handleInfluenceChange('teamSize', numValue);
                    }
                  }
                }}
                error={!!errors.teamSize}
                helperText={errors.teamSize}
                placeholder="0"
                sx={{ '& .MuiInputBase-root': { height: 40 } }}
              />
              <TextField
                fullWidth
                size="small"
                label="Decision Power (1-10)"
                type="number"
                value={formData.influence?.decisionPower || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleInfluenceChange('decisionPower', undefined);
                  } else {
                    const numValue = Number(value);
                    if (!isNaN(numValue)) {
                      handleInfluenceChange('decisionPower', numValue);
                    }
                  }
                }}
                error={!!errors.decisionPower}
                helperText={errors.decisionPower}
                placeholder="1-10"
                sx={{ '& .MuiInputBase-root': { height: 40 } }}
              />
              <TextField
                fullWidth
                size="small"
                label="Adoption Influence (1-10)"
                type="number"
                value={formData.influence?.adoptionInfluence || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleInfluenceChange('adoptionInfluence', undefined);
                  } else {
                    const numValue = Number(value);
                    if (!isNaN(numValue)) {
                      handleInfluenceChange('adoptionInfluence', numValue);
                    }
                  }
                }}
                error={!!errors.adoptionInfluence}
                helperText={errors.adoptionInfluence}
                placeholder="1-10"
                sx={{ '& .MuiInputBase-root': { height: 40 } }}
              />
            </Box>
          </Box>

          <Divider />

          {/* Notes Section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
              Additional Notes
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="Notes"
              multiline
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about the stakeholder..."
              sx={{ '& .MuiInputBase-root': { minHeight: 40 } }}
            />
          </Box>

          {/* Action Buttons */}
          <Box sx={{ pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={onCancel}
                disabled={isLoading}
                size="medium"
              >
                Cancel
              </Button> 
              <Button
                variant="contained"
                startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
                disabled={isLoading}
                size="medium"
                onClick={handleSubmit}
              >
                {isLoading ? 'Saving...' : mode === 'create' ? 'Create Stakeholder' : 'Update Stakeholder'}
              </Button>
            </Stack>
          </Box>
        </Box>
    </Box>
  );
};

export default observer(StakeholderForm);
