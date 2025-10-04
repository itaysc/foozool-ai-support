import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Card, CardContent, Select, MenuItem, FormControl, InputLabel, CircularProgress, Tabs, Tab } from '@mui/material';
import { HealthScoreFactors, HealthScoresResponse, DataIntelligenceMetrics, CustomerDataIntelligence } from '@/types/dataIntelligence';
import HealthScoreCard from '@/components/insights/HealthScoreCard';
import HealthScoresList from '@/components/insights/HealthScoresList';
import DataIntelligenceDashboard from '@/components/insights/DataIntelligenceDashboard';
import { Dashboard, HealthAndSafety } from '@mui/icons-material';
import { insightsService } from '@/services/insights-service';
import { surveysService } from '@/services/surveys-service';

interface HealthScoreTabProps {
  selectedCustomer: string | null;
  customers: any[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCustomerChange: (customerId: string) => void;
}

const HealthScoreTab: React.FC<HealthScoreTabProps> = ({
  selectedCustomer,
  customers,
  loading,
  error,
  onRefresh,
  onCustomerChange
}) => {
  const [activeSubTab, setActiveSubTab] = useState(0);
  
  // Health Score State
  const [customerHealthScore, setCustomerHealthScore] = useState<HealthScoreFactors | null>(null);
  const [allHealthScores, setAllHealthScores] = useState<HealthScoresResponse | null>(null);
  const [healthScoreLoading, setHealthScoreLoading] = useState(false);
  const [healthScoreError, setHealthScoreError] = useState<string | null>(null);
  
  // Data Intelligence State
  const [dataIntelligenceMetrics, setDataIntelligenceMetrics] = useState<DataIntelligenceMetrics | null>(null);
  const [customerDataIntelligence, setCustomerDataIntelligence] = useState<CustomerDataIntelligence | null>(null);
  const [dataIntelligenceLoading, setDataIntelligenceLoading] = useState(false);
  const [dataIntelligenceError, setDataIntelligenceError] = useState<string | null>(null);

  // Load all health scores
  const loadAllHealthScores = async () => {
    try {
      setHealthScoreLoading(true);
      setHealthScoreError(null);
      
      const healthScoresRes = await insightsService.getAllCustomerHealthScores();
      setAllHealthScores(healthScoresRes.data);
    } catch (error) {
      console.error('Error loading health scores:', error);
      setHealthScoreError('Failed to load health scores');
    } finally {
      setHealthScoreLoading(false);
    }
  };

  // Load customer-specific health score
  const loadCustomerHealthScore = async (customerId: string) => {
    try {
      setHealthScoreLoading(true);
      setHealthScoreError(null);
      
      const healthScoreRes = await insightsService.getCustomerHealthScore(customerId);
      setCustomerHealthScore(healthScoreRes.data.healthScore);
    } catch (error) {
      console.error('Error loading customer health score:', error);
      setHealthScoreError('Failed to load customer health score');
    } finally {
      setHealthScoreLoading(false);
    }
  };

  // Load Data Intelligence Metrics
  const loadDataIntelligenceMetrics = async () => {
    try {
      setDataIntelligenceLoading(true);
      setDataIntelligenceError(null);
      
      const metricsRes = await insightsService.getDataIntelligenceMetrics();
      setDataIntelligenceMetrics(metricsRes.data);
    } catch (error) {
      console.error('Error loading data intelligence metrics:', error);
      setDataIntelligenceError('Failed to load data intelligence metrics');
    } finally {
      setDataIntelligenceLoading(false);
    }
  };

  // Load Customer-Specific Data Intelligence
  const loadCustomerDataIntelligence = async (customerId: string) => {
    try {
      setDataIntelligenceLoading(true);
      setDataIntelligenceError(null);
      
      const dataIntelligenceRes = await insightsService.getCustomerDataIntelligence(customerId);
      setCustomerDataIntelligence(dataIntelligenceRes.data);
    } catch (error) {
      console.error('Error loading customer data intelligence:', error);
      setDataIntelligenceError('Failed to load customer data intelligence');
    } finally {
      setDataIntelligenceLoading(false);
    }
  };

  // Load health scores and data intelligence on component mount
  useEffect(() => {
    loadAllHealthScores();
    loadDataIntelligenceMetrics();
  }, []);

  // Load customer-specific data when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerHealthScore(selectedCustomer);
      loadCustomerDataIntelligence(selectedCustomer);
    } else {
      setCustomerHealthScore(null);
      setCustomerDataIntelligence(null);
    }
  }, [selectedCustomer]);

  // Handle customer selection change
  const handleCustomerSelectionChange = (customerId: string) => {
    onCustomerChange(customerId);
  };

  if (loading || healthScoreLoading || dataIntelligenceLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || healthScoreError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || healthScoreError}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Sub-tabs for Health Scores and Data Intelligence */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeSubTab} 
          onChange={(_, newValue) => setActiveSubTab(newValue)}
          sx={{ minHeight: 48 }}
        >
          <Tab 
            icon={<HealthAndSafety />} 
            label="Health Scores" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          />
          <Tab 
            icon={<Dashboard />} 
            label="Data Intelligence" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeSubTab === 0 && (
        <Box>
          {/* All Customers Health Scores Table */}
          {allHealthScores && (
            <Box sx={{ mb: 4 }}>
              <HealthScoresList healthScores={allHealthScores} />
            </Box>
          )}

      {/* Customer Selection for Detailed Health Score */}
      {allHealthScores && (
        <Box sx={{ mb: 4 }}>
          <Card sx={{ p: 3, backgroundColor: '#f8fafc' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              View Detailed Health Score
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a customer to view their detailed health score breakdown
            </Typography>
            <FormControl fullWidth sx={{ maxWidth: 400 }}>
              <InputLabel>Select Customer</InputLabel>
              <Select
                value={selectedCustomer || ''}
                onChange={(e) => handleCustomerSelectionChange(e.target.value)}
                label="Select Customer"
              >
                {customers.map((customer) => (
                  <MenuItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Card>
        </Box>
      )}

      {/* Individual Customer Health Score */}
      {selectedCustomer && customerHealthScore && (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            {customers.find(c => c._id === selectedCustomer)?.name} - Detailed Health Score
          </Typography>
          <HealthScoreCard 
            healthScore={customerHealthScore} 
            customerName={customers.find(c => c._id === selectedCustomer)?.name}
          />
        </Box>
      )}

          {!allHealthScores && !customerHealthScore && (
            <Alert severity="info">
              No health scores available. Please try refreshing the page.
            </Alert>
          )}
        </Box>
      )}

      {activeSubTab === 1 && (
        <Box>
          {dataIntelligenceError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {dataIntelligenceError}
            </Alert>
          )}
          {dataIntelligenceLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={60} />
            </Box>
          ) : dataIntelligenceMetrics ? (
            <DataIntelligenceDashboard metrics={dataIntelligenceMetrics} />
          ) : (
            <Alert severity="info">
              No data intelligence metrics available. Please try refreshing the page.
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default HealthScoreTab;
