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
  Stack,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Delete,
  Cancel,
  Help
} from '@mui/icons-material';
import { observer } from 'mobx-react';
import { ICustomer, CreateCustomerRequest, UpdateCustomerRequest } from '@/types';
import toast from '@/utils/toast';
import botsStore from '@/stores/bots.store';
import customersStore from '@/stores/customers.store';
import SelectBase from '@/components/base/Select';
import Modal from '@/components/Modal';
import industriesStore from '@/stores/industries.store';
import customerActivityStore from '../../stores/customer-activity.store';
import { COUNTRIES } from '@/constants/countries';
import { REGIONS } from '@/constants/regions';
import { LANGUAGES } from '@/constants/languages';
import { EXCHANGES } from '@/constants/exchanges';
import TagsInput from '@/components/tagsInput';
import StakeholderManagement from '@/components/stakeholder/StakeholderManagement';

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
  const [tab, setTab] = useState<'general' | 'media' | 'geo' | 'features' | 'stakeholders' | 'bots'>('general');
  const [addUsageOpen, setAddUsageOpen] = useState(false);
  const [newUsage, setNewUsage] = useState<{ featureName: string; metricType: 'count' | 'amount' | 'percentage' | 'duration' | 'custom'; metricValue?: number; unit?: string; usageDate?: string }>({ featureName: '', metricType: 'count' });
  const [addBotOpen, setAddBotOpen] = useState(false);
  const [newBot, setNewBot] = useState<{ name: string; type: 'customer_success' }>({ name: '', type: 'customer_success' });
  
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    industry: '',
    companySize: undefined,
    contractValue: undefined,
    startDate: '',
    accountManager: '',
    healthScore: undefined,
    notes: '',
    // Ensure optional fields are present so UI can bind properly
    segment: undefined as any,
    usageData: undefined,
    // media enrichment defaults
    website: '',
    domains: [],
    hq: undefined,
    operatingRegions: [],
    countriesServed: [],
    languages: [],
    publicListing: { isPublic: false },
    newsKeywords: [],
    excludedKeywords: [],
    competitorNames: [],
    productLines: [],
    contentSources: [],
    mediaLookbackDaysDefault: 30,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (mode === 'edit' && customerId) {
      fetchCustomer();
    }
    customerActivityStore.ensureLoaded();
    industriesStore.ensureLoaded();
    if (customerId) {
      customerActivityStore.loadUsageForCustomer(customerId);
    }
    botsStore.load();
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
          segment: (customerData as any).segment,
          usageData: customerData.usageData ? {
            activeUsersCount: customerData.usageData.activeUsersCount,
            seatsPurchased: customerData.usageData.seatsPurchased,
            seatsUsed: customerData.usageData.seatsUsed,
          } : undefined,
          // Geo / Media & Signals fields
          website: customerData.website || '',
          domains: customerData.domains || [],
          hq: customerData.hq as any,
          operatingRegions: customerData.operatingRegions || [],
          countriesServed: customerData.countriesServed || [],
          languages: customerData.languages || [],
          publicListing: customerData.publicListing || { isPublic: false },
          newsKeywords: customerData.newsKeywords || [],
          excludedKeywords: customerData.excludedKeywords || [],
          competitorNames: customerData.competitorNames || [],
          productLines: customerData.productLines || [],
          contentSources: customerData.contentSources || [],
          mediaLookbackDaysDefault: customerData.mediaLookbackDaysDefault ?? 30,
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

    // Normalize payload for server (ISO datetime for startDate)
    const payload: CreateCustomerRequest = {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
    };

    try {
      if (mode === 'create') {
        await customersStore.createCustomer(payload);
      } else if (customerId) {
        await customersStore.updateCustomer(customerId, payload);
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
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
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

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="General" value="general" />
        <Tab label="Geo" value="geo" />
        <Tab label="Media & Signals" value="media" />
        <Tab label="Customer Activity" value="features" />
        {mode === 'edit' && <Tab label="Stakeholders" value="stakeholders" />}
        {mode === 'edit' && <Tab label="Bots" value="bots" />}
      </Tabs>

      <form onSubmit={handleSubmit}>
        {tab === 'general' && (
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
                <SelectBase
                  value={formData.industry}
                  onChange={(value) => handleInputChange('industry', value as string)}
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
                  onChange={(v) => handleInputChange('segment' as any, v as any)}
                  size="small"
                  fullWidth
                  label="Customer Segment"
                  placeholder="Select segment"
                  allowClear
                  options={[ 'SMB', 'Mid-Market', 'Enterprise', 'Other' ]}
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
                  onChange={(e) => handleInputChange('usageData' as any, { ...(formData as any).usageData, activeUsersCount: e.target.value === '' ? undefined : Number(e.target.value) })}
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Seats Purchased"
                  type="number"
                  value={(formData as any).usageData?.seatsPurchased || ''}
                  onChange={(e) => handleInputChange('usageData' as any, { ...(formData as any).usageData, seatsPurchased: e.target.value === '' ? undefined : Number(e.target.value) })}
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Seats Used"
                  type="number"
                  value={(formData as any).usageData?.seatsUsed || ''}
                  onChange={(e) => handleInputChange('usageData' as any, { ...(formData as any).usageData, seatsUsed: e.target.value === '' ? undefined : Number(e.target.value) })}
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
        )}

        {tab === 'geo' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Geography</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <SelectBase
                value={(formData as any).hq?.country || ''}
                onChange={(v) => handleInputChange('hq' as any, { ...(formData as any).hq, country: String(v) })}
                size="small"
                fullWidth
                label="HQ Country"
                placeholder="Select country"
                searchable
                allowClear
                options={COUNTRIES}
              />
              <SelectBase
                value={(formData as any).hq?.region || ''}
                onChange={(v) => handleInputChange('hq' as any, { ...(formData as any).hq, region: String(v) })}
                size="small"
                fullWidth
                label="Region"
                placeholder="Select region"
                allowClear
                options={REGIONS}
              />
              <TextField fullWidth size="small" label="City" value={(formData as any).hq?.city || ''} onChange={(e) => handleInputChange('hq' as any, { ...(formData as any).hq, city: e.target.value })} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <SelectBase
                value={(formData.operatingRegions || []) as any}
                onChange={(vals) => handleInputChange('operatingRegions', (Array.isArray(vals) ? vals.map(String) : []) as string[])}
                size="small"
                fullWidth
                label="Operating Regions"
                placeholder="Select operating regions"
                multiple
                searchable
                allowClear
                options={REGIONS}
              />
              <SelectBase
                value={(formData.countriesServed || []) as any}
                onChange={(vals) => handleInputChange('countriesServed', (Array.isArray(vals) ? vals.map(String) : []) as string[])}
                size="small"
                fullWidth
                label="Countries Served"
                placeholder="Select countries"
                multiple
                searchable
                allowClear
                options={[ 'International', ...COUNTRIES.filter(c => c !== 'International') ]}
              />
            </Box>
            <SelectBase
              value={(formData.languages || []) as any}
              onChange={(vals) => handleInputChange('languages', (Array.isArray(vals) ? vals.map(String) : []) as string[])}
              size="small"
              fullWidth
              label="Languages"
              placeholder="Select languages"
              multiple
              searchable
              allowClear
              options={LANGUAGES}
            />
          </Box>
        )}

        {tab === 'media' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Media & Signals</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth size="small" label="Website" value={formData.website || ''} onChange={(e) => handleInputChange('website', e.target.value)} />
              <TagsInput
                value={(formData.domains || [])}
                onChange={(vals) => handleInputChange('domains', vals)}
                label="Domains"
                placeholder="Domains (Comma-Separated)"
                normalize={(t) => t.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Public Listing</InputLabel>
                <Select label="Public Listing" value={(formData.publicListing?.isPublic ? 'public' : 'private') as any} onChange={(e) => handleInputChange('publicListing' as any, { ...(formData as any).publicListing, isPublic: e.target.value === 'public' })}>
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="public">Public</MenuItem>
                </Select>
              </FormControl>
              <TextField size="small" label="Ticker" value={(formData.publicListing?.ticker) || ''} onChange={(e) => handleInputChange('publicListing' as any, { ...(formData as any).publicListing, ticker: e.target.value })} />
              <SelectBase
                value={(formData.publicListing?.exchange) || ''}
                onChange={(v) => handleInputChange('publicListing' as any, { ...(formData as any).publicListing, exchange: String(v) })}
                size="small"
                label="Exchange"
                placeholder="Select exchange"
                allowClear
                searchable
                options={EXCHANGES}
              />
            </Box>
            <TagsInput
              value={(formData.newsKeywords || [])}
              onChange={(vals) => handleInputChange('newsKeywords', vals)}
              label="News Keywords"
              placeholder="Keywords (Comma-Separated)"
            />
            <TagsInput
              value={(formData.excludedKeywords || [])}
              onChange={(vals) => handleInputChange('excludedKeywords', vals)}
              label="Excluded Keywords"
              placeholder="Excluded Keywords (Comma-Separated)"
            />
            <TagsInput
              value={(formData.competitorNames || [])}
              onChange={(vals) => handleInputChange('competitorNames', vals)}
              label="Competitors"
              placeholder="Competitors (Comma-Separated)"
            />
            <TagsInput
              value={(formData.productLines || [])}
              onChange={(vals) => handleInputChange('productLines', vals)}
              label="Product Lines"
              placeholder="Product Lines (Comma-Separated)"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TagsInput
                value={(formData.contentSources || []).map((s: any) => s?.handleOrUrl || String(s))}
                onChange={(vals) => handleInputChange('contentSources', vals.map((s) => ({ type: 'custom', handleOrUrl: s })))}
                label="Content Sources (URLs/handles)"
                placeholder="Content Sources (Comma-Separated)"
                normalize={(t) => t.trim()}
              />
              <TextField size="small" label="Default Lookback Days" type="number" value={formData.mediaLookbackDaysDefault ?? 30} onChange={(e) => handleInputChange('mediaLookbackDaysDefault', e.target.value === '' ? undefined : Number(e.target.value))} />
            </Box>
          </Box>
        )}

        {tab === 'features' && (
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
                        <TableCell sx={{ textTransform: 'capitalize' }}>{u.metricType || (u.utilizationPercent !== undefined ? 'percentage' : (u.activeUsersCount !== undefined ? 'count' : '-'))}</TableCell>
                        <TableCell align="right">{u.metricValue ?? u.utilizationPercent ?? u.activeUsersCount ?? '-'}</TableCell>
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
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this activity?')) {
                                  try {
                                    await customerActivityStore.deleteActivity(u._id, customerId);
                                    toast.success('Activity deleted successfully');
                                  } catch (error) {
                                    console.error('Failed to delete activity:', error);
                                    toast.error('Failed to delete activity. Please try again.');
                                  }
                                }
                              }}
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
          </Box>
        )}

        {tab === 'stakeholders' && mode === 'edit' && customerId && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <StakeholderManagement customerId={customerId} />
          </Box>
        )}

        {tab === 'bots' && mode === 'edit' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Configure AI Bots</Typography>
              <Button variant="text" onClick={() => setAddBotOpen(true)}>+ Add Bot</Button>
            </Box>
            {/* Removed explanatory text here; moved into modal */}

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Existing Bots</Typography>
              {botsStore.isLoading ? (
                <CircularProgress size={24} />
              ) : botsStore.items.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No bots yet.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {botsStore.items.map((b) => (
                      <TableRow key={b._id}>
                        <TableCell>{b.name}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{b.type.replace('_', ' ')}</TableCell>
                        <TableCell>{new Date(b.createdAt).toISOString().split('T')[0]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Box>
        )}
        </form>

        <Modal open={addUsageOpen} onClose={() => setAddUsageOpen(false)} title="Add Customer Activity" maxWidth="sm" contentTopGap={5}
          actions={
            <>
              <Button onClick={() => setAddUsageOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={async () => {
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
              }}>Add Usage</Button>
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

        {/* Add Bot Modal */}
        <Modal
          open={addBotOpen}
          onClose={() => setAddBotOpen(false)}
          title="Add Bot"
          maxWidth="sm"
          contentTopGap={3}
          actions={
            <>
              <Button onClick={() => setAddBotOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  if (!newBot.name.trim()) return;
                  await botsStore.create({ name: newBot.name.trim(), type: newBot.type });
                  setAddBotOpen(false);
                  setNewBot({ name: '', type: 'customer_success' });
                }}
                disabled={botsStore.isSaving}
              >
                {botsStore.isSaving ? 'Creating...' : 'Create'}
              </Button>
            </>
          }
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Create bots that generate specific insights.
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="Bot Name"
              value={newBot.name}
              onChange={(e) => setNewBot(prev => ({ ...prev, name: e.target.value }))}
              sx={{ '& .MuiInputBase-root': { height: 40 } }}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Bot Type</InputLabel>
              <Select
                label="Bot Type"
                value={newBot.type}
                onChange={(e) => setNewBot(prev => ({ ...prev, type: e.target.value as any }))}
                sx={{ height: 40 }}
              >
                <MenuItem value="customer_success">Customer Success Insights</MenuItem>
                <MenuItem value="issue_insights">Issue Insights</MenuItem>
                <MenuItem value="predictions">Predictions</MenuItem>
                <MenuItem value="nps">NPS Insights</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Modal>
        
        
    </Box>
  );
};

export default observer(CustomerForm);
