import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Card, CardContent, Button, Select, MenuItem, FormControl, InputLabel, Paper, Divider, Chip, CircularProgress, Tabs, Tab } from '@mui/material';
import { CustomerSuccessInsight } from '@/types/customerSuccess';
import { DataIntelligenceMetrics, HealthScoreFactors, HealthScoresResponse, PredictiveInsights, CustomerDataIntelligence } from '@/types/dataIntelligence';
import PageHeader from '@/components/insights/PageHeader';
import DataIntelligenceDashboard from '@/components/insights/DataIntelligenceDashboard';
import HealthScoreCard from '@/components/insights/HealthScoreCard';
import HealthScoresList from '@/components/insights/HealthScoresList';
import PredictiveInsightsCard from '@/components/insights/PredictiveInsightsCard';
import { EnhancedInsightsView } from '@/components/insights';
import { Description, Download, Dashboard, HealthAndSafety, Psychology, Analytics } from '@mui/icons-material';
import { insightsService } from '@/services/insights-service';
import { surveysService } from '@/services/surveys-service';
import CustomerMeetingPrepModal from '@/components/insights/CustomerMeetingPrepModal';

interface CustomerSuccessTabProps {
  csInsights: CustomerSuccessInsight[];
  csatInsights: any | null;
  selectedCustomer: string | null;
  customers: any[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCustomerChange: (customerId: string) => void;
}

const CustomerSuccessTab: React.FC<CustomerSuccessTabProps> = ({
  csInsights,
  csatInsights,
  selectedCustomer,
  customers,
  loading,
  error,
  onRefresh,
  onCustomerChange
}) => {
  const [meetingPrepModalOpen, setMeetingPrepModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState(0);
  
  // Data Intelligence State
  const [dataIntelligenceMetrics, setDataIntelligenceMetrics] = useState<DataIntelligenceMetrics | null>(null);
  const [customerHealthScore, setCustomerHealthScore] = useState<HealthScoreFactors | null>(null);
  const [allHealthScores, setAllHealthScores] = useState<HealthScoresResponse | null>(null);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsights | null>(null);
  const [customerDataIntelligence, setCustomerDataIntelligence] = useState<CustomerDataIntelligence | null>(null);
  const [dataIntelligenceLoading, setDataIntelligenceLoading] = useState(false);
  const [dataIntelligenceError, setDataIntelligenceError] = useState<string | null>(null);
  
  // Customer-specific CSAT insights (separate from org-level insights passed as prop)
  const [customerCsatInsights, setCustomerCsatInsights] = useState<any | null>(null);

  // Load Data Intelligence Metrics
  const loadDataIntelligenceMetrics = async () => {
    try {
      setDataIntelligenceLoading(true);
      setDataIntelligenceError(null);
      
      const [metricsRes, healthScoresRes, predictiveRes] = await Promise.all([
        insightsService.getDataIntelligenceMetrics(),
        insightsService.getAllCustomerHealthScores(),
        insightsService.getPredictiveInsights()
      ]);
      
      setDataIntelligenceMetrics(metricsRes.data);
      setAllHealthScores(healthScoresRes.data);
      setPredictiveInsights(predictiveRes.data);
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
      
      const [healthScoreRes, dataIntelligenceRes, csatRes] = await Promise.all([
        insightsService.getCustomerHealthScore(customerId),
        insightsService.getCustomerDataIntelligence(customerId),
        surveysService.getCSATInsights(customerId).catch(err => {
          console.warn('CSAT insights not available for customer:', err);
          return null;
        })
      ]);
      
      setCustomerHealthScore(healthScoreRes.data.healthScore);
      setCustomerDataIntelligence(dataIntelligenceRes.data);
      setCustomerCsatInsights(csatRes);
    } catch (error) {
      console.error('Error loading customer data intelligence:', error);
      setDataIntelligenceError('Failed to load customer data intelligence');
    } finally {
      setDataIntelligenceLoading(false);
    }
  };

  // Load data intelligence on component mount
  useEffect(() => {
    loadDataIntelligenceMetrics();
  }, []);

  // Load customer-specific data when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerDataIntelligence(selectedCustomer);
    } else {
      setCustomerHealthScore(null);
      setCustomerDataIntelligence(null);
    }
  }, [selectedCustomer]);

  const handleOpenMeetingPrepModal = () => {
    setMeetingPrepModalOpen(true);
  };

  const handleCloseMeetingPrepModal = () => {
    setMeetingPrepModalOpen(false);
  };

  const handleGenerateMeetingPrep = async (customerId: string) => {
    const blob = await insightsService.generateCustomerMeetingPrep(customerId);
    
    // Get customer name for filename
    const customer = customers.find(c => c._id === customerId);
    const customerName = customer?.name || customer?.companyName || 'Unknown Customer';
    const sanitizedCustomerName = customerName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meeting-prep-${sanitizedCustomerName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleSubTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveSubTab(newValue);
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }


  return (
    <Box>
      <PageHeader
        title="Customer Success Insights"
        subtitle="AI-powered customer success analysis and data intelligence"
        loading={loading || dataIntelligenceLoading}
        onRefresh={() => {
          onRefresh();
          loadDataIntelligenceMetrics();
          if (selectedCustomer) {
            loadCustomerDataIntelligence(selectedCustomer);
          }
        }}
        actionButton={
          <Button
            variant="contained"
            startIcon={<Description />}
            onClick={handleOpenMeetingPrepModal}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              }
            }}
          >
            Meeting Prep
          </Button>
        }
      />

      {/* Sub-tabs for different views */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeSubTab} onChange={handleSubTabChange} aria-label="customer success tabs">
          <Tab 
            icon={<Analytics />} 
            label="Customer Insights" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          />
          <Tab 
            icon={<Dashboard />} 
            label="Data Intelligence" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          />
          <Tab 
            icon={<HealthAndSafety />} 
            label="Health Scores" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          />
          <Tab 
            icon={<Psychology />} 
            label="Predictive Insights" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          />
        </Tabs>
      </Box>


      {/* Tab Content */}
      {activeSubTab === 0 && (
        <Box>
          {!selectedCustomer ? (
            <Alert severity="info">
              Please select a customer to view their specific insights and health score.
            </Alert>
          ) : (
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
              ) : (
                <Box>
                  {/* Enhanced Customer Success Insights */}
                  <EnhancedInsightsView
                    insights={csInsights}
                    loading={loading}
                    onRefresh={onRefresh}
                    selectedCustomer={selectedCustomer}
                    customers={customers}
                    onCustomerChange={onCustomerChange}
                  />

                  {/* CSAT Insights Section */}
                  {customerCsatInsights && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                        Customer Satisfaction (CSAT) Insights
                      </Typography>
                      
                      <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Overall CSAT Score
                            </Typography>
                            <Chip 
                              label={`${customerCsatInsights.currentCSAT || 0}%`}
                              color={customerCsatInsights.currentCSAT >= 80 ? 'success' : customerCsatInsights.currentCSAT >= 60 ? 'warning' : 'error'}
                              sx={{ fontSize: '1rem', fontWeight: 600, px: 2, py: 1 }}
                            />
                          </Box>
                          
                          {customerCsatInsights.csatChange && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Change from previous period: {customerCsatInsights.csatChange > 0 ? '+' : ''}{customerCsatInsights.csatChange}%
                            </Typography>
                          )}
                          
                          <Typography variant="body2" color="text.secondary">
                            Total Responses: {customerCsatInsights.totalResponses || 0} | 
                            Response Rate: {customerCsatInsights.responseRate || 0}%
                          </Typography>
                        </CardContent>
                      </Card>

                      {customerCsatInsights.recentFeedback && customerCsatInsights.recentFeedback.length > 0 && (
                        <Card sx={{ border: '1px solid #e0e0e0' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                              Recent Feedback
                            </Typography>
                            {customerCsatInsights.recentFeedback.map((feedback, index) => (
                              <Box key={index} sx={{ mb: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  "{feedback.comment}"
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Score: {feedback.score}/5 | {new Date(feedback.date).toLocaleDateString()}
                                </Typography>
                              </Box>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
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

      {activeSubTab === 2 && (
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
          ) : (
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
                        onChange={(e) => onCustomerChange(e.target.value)}
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
        </Box>
      )}

      {activeSubTab === 3 && (
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
          ) : predictiveInsights ? (
            <PredictiveInsightsCard insights={predictiveInsights} />
          ) : (
            <Alert severity="info">
              No predictive insights available. Please try refreshing the page.
            </Alert>
          )}
        </Box>
      )}

      {/* Meeting Prep Modal */}
      <CustomerMeetingPrepModal
        open={meetingPrepModalOpen}
        onClose={handleCloseMeetingPrepModal}
        customers={customers}
        onGenerate={handleGenerateMeetingPrep}
      />
    </Box>
  );
};

export default CustomerSuccessTab;
