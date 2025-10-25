import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Stack,
} from '@mui/material';
import { ArrowBack, Save, Cancel } from '@mui/icons-material';
import { observer } from 'mobx-react';
import { ICustomer, CreateCustomerRequest } from '@/types';
import customersStore from '@/stores/customers.store';
import industriesStore from '@/stores/industries.store';
import customerActivityStore from '../../stores/customer-activity.store';
import botsStore from '@/stores/bots.store';
import {
  GeneralTab,
  GeoTab,
  MediaTab,
  FeaturesTab,
  FinancialTab,
  CustomerSuccessTab,
  SuccessMetricsTab,
  CapacityGrowthTab,
  StakeholdersTab,
  BotsTab,
  SLATab,
} from './tabs';

interface CustomerFormProps {
  mode: 'create' | 'edit';
}

interface FormErrors {
  name?: string;
  industry?: string;
  companySize?: string;
  startDate?: string;
  accountManager?: string;
  healthScore?: string;
  notes?: string;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [tab, setTab] = useState<'general' | 'media' | 'geo' | 'features' | 'financial' | 'customerSuccess' | 'successMetrics' | 'capacityGrowth' | 'stakeholders' | 'bots' | 'sla'>('general');
  
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    logo: '',
    industry: '',
    companySize: undefined,
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
    // Financial metrics defaults
    financialMetrics: {
      annualRecurringRevenue: undefined,
      monthlyRecurringRevenue: undefined,
      contractRenewalDate: undefined,
      contractValue: undefined,
      paymentHistory: [],
      creditScore: undefined,
      paymentTerms: 'net30',
      lastPaymentDate: undefined,
      outstandingBalance: 0,
      averagePaymentDays: undefined,
      paymentReliability: 'good',
    },
    // Success Criteria defaults
    successCriteria: undefined,
    // Capacity Growth defaults  
    capacityGrowth: undefined,
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
          logo: customerData.logo || '',
          industry: customerData.industry || '',
          companySize: customerData.companySize,
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
          // Financial metrics
          financialMetrics: customerData.financialMetrics ? {
            annualRecurringRevenue: customerData.financialMetrics.annualRecurringRevenue,
            monthlyRecurringRevenue: customerData.financialMetrics.monthlyRecurringRevenue,
            contractRenewalDate: customerData.financialMetrics.contractRenewalDate ? customerData.financialMetrics.contractRenewalDate.split('T')[0] : undefined,
            contractValue: customerData.financialMetrics.contractValue,
            paymentHistory: customerData.financialMetrics.paymentHistory || [],
            creditScore: customerData.financialMetrics.creditScore,
            paymentTerms: customerData.financialMetrics.paymentTerms || 'net30',
            lastPaymentDate: customerData.financialMetrics.lastPaymentDate ? customerData.financialMetrics.lastPaymentDate.split('T')[0] : undefined,
            outstandingBalance: customerData.financialMetrics.outstandingBalance || 0,
            averagePaymentDays: customerData.financialMetrics.averagePaymentDays,
            paymentReliability: customerData.financialMetrics.paymentReliability || 'good',
          } : {
            annualRecurringRevenue: undefined,
            monthlyRecurringRevenue: undefined,
            contractRenewalDate: undefined,
            contractValue: undefined,
            paymentHistory: [],
            creditScore: undefined,
            paymentTerms: 'net30',
            lastPaymentDate: undefined,
            outstandingBalance: 0,
            averagePaymentDays: undefined,
            paymentReliability: 'good',
          },
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


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Normalize payload for server (ISO datetime for startDate and financial dates)
    const payload: CreateCustomerRequest = {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      financialMetrics: formData.financialMetrics ? {
        ...formData.financialMetrics,
        contractRenewalDate: formData.financialMetrics.contractRenewalDate ? new Date(formData.financialMetrics.contractRenewalDate).toISOString() : undefined,
        lastPaymentDate: formData.financialMetrics.lastPaymentDate ? new Date(formData.financialMetrics.lastPaymentDate).toISOString() : undefined,
        paymentHistory: formData.financialMetrics.paymentHistory?.map(payment => ({
          ...payment,
          date: new Date(payment.date).toISOString()
        }))
      } : undefined,
    };

    // Debug log to confirm logo is included
    if (payload.logo) {
      console.log('Sending customer with logo:', {
        name: payload.name,
        hasLogo: !!payload.logo,
        logoSize: payload.logo.length,
        logoPreview: payload.logo.substring(0, 50) + '...'
      });
    }

    try {
      if (mode === 'create') {
        await customersStore.createCustomer(payload);
      } else if (customerId) {
        await customersStore.updateCustomer(customerId, payload);
      }
      
      navigate('/dashboard/customers');
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

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or SVG)');
      return;
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      alert('File size must be less than 2MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFormData(prev => ({ ...prev, logo: result }));
    };
    reader.readAsDataURL(file);
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
          onClick={() => navigate('/dashboard/customers')}
          variant="text"
          sx={{ mb: 2, color: 'text.secondary', p: 0 }}
        >
          Back to Customers
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
            {mode === 'create' ? 'Add New Customer' : 'Edit Customer'}
          </Typography>
          {/* Customer Logo */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            mt: 1
          }}>
            <Box 
              onClick={handleLogoClick}
              sx={{
                width: 80,
                height: 80,
                borderRadius: 2,
                border: '2px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: '#eeeeee',
                  borderColor: '#bdbdbd'
                }
              }}
            >
              {formData.logo ? (
                <img 
                  src={formData.logo} 
                  alt={`${formData.name} logo`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <Typography variant="body2" sx={{ 
                  color: '#9e9e9e',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textAlign: 'center'
                }}>
                  Add Logo
                </Typography>
              )}
            </Box>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/svg+xml"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </Box>
        </Box>
      </Box>

      {customersStore.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {customersStore.error}
        </Alert>
      )}

      <Tabs 
        value={tab} 
        onChange={(_, v) => setTab(v)} 
        sx={{ 
          mb: 2,
          '& .MuiTabs-scroller': {
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: '3px',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.5)',
              },
            },
          },
          '& .MuiTabs-flexContainer': {
            minWidth: 'max-content',
          },
          '& .MuiTab-root': {
            minWidth: 'auto',
            paddingX: 2,
            whiteSpace: 'nowrap',
          }
        }}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        <Tab label="General" value="general" />
        <Tab label="Geo" value="geo" />
        <Tab label="Media & Signals" value="media" />
        <Tab label="Customer Activity" value="features" />
        <Tab label="Financial" value="financial" />
        <Tab label="Customer Success" value="customerSuccess" />
        <Tab label="Success Metrics" value="successMetrics" />
        <Tab label="Capacity & Growth" value="capacityGrowth" />
        <Tab label="SLA" value="sla" />
        {mode === 'edit' && <Tab label="Stakeholders" value="stakeholders" />}
        {mode === 'edit' && <Tab label="Bots" value="bots" />}
      </Tabs>

      <form onSubmit={handleSubmit}>
        {tab === 'general' && (
          <GeneralTab
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
          />
        )}

        {tab === 'geo' && (
          <GeoTab
            formData={formData}
            onInputChange={handleInputChange}
          />
        )}

        {tab === 'media' && (
          <MediaTab
            formData={formData}
            onInputChange={handleInputChange}
          />
        )}

        {tab === 'features' && (
          <FeaturesTab
            formData={formData}
            mode={mode}
            customerId={customerId}
          />
        )}

        {tab === 'financial' && (
          <FinancialTab
            formData={formData}
            onInputChange={handleInputChange}
          />
        )}

        {tab === 'customerSuccess' && (
          <CustomerSuccessTab
            formData={formData}
            onInputChange={handleInputChange}
          />
        )}

        {tab === 'successMetrics' && (
          <SuccessMetricsTab
            formData={formData}
            onInputChange={handleInputChange}
          />
        )}

        {tab === 'capacityGrowth' && (
          <CapacityGrowthTab
            formData={formData}
            onInputChange={handleInputChange}
          />
        )}

        {tab === 'sla' && (
          <SLATab
            formData={formData}
            onInputChange={handleInputChange}
          />
        )}

        {tab === 'stakeholders' && mode === 'edit' && customerId && (
          <StakeholdersTab
            customerId={customerId}
          />
        )}

        {tab === 'bots' && mode === 'edit' && (
          <BotsTab
            mode={mode}
          />
        )}
      </form>

      {/* Footer with Action Buttons - Always Visible */}
      <Box sx={{ 
        pt: 3, 
        mt: 4, 
        borderTop: '1px solid', 
        borderColor: 'divider',
        position: 'sticky',
        bottom: 0,
        zIndex: 1
      }}>
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => navigate('/dashboard/customers')}
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
            onClick={handleSubmit}
          >
            {customersStore.isSaving ? 'Saving...' : mode === 'create' ? 'Create Customer' : 'Update Customer'}
          </Button>
        </Stack>
      </Box>
        
    </Box>
  );
};

export default observer(CustomerForm);
