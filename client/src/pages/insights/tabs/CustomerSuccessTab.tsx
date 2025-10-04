import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Card, CardContent, Button, Select, MenuItem, FormControl, InputLabel, Paper, Divider, Chip, CircularProgress, Tabs, Tab } from '@mui/material';
import { CustomerSuccessInsight } from '@/types/customerSuccess';
import { PredictiveInsights } from '@/types/dataIntelligence';
import PageHeader from '@/components/insights/PageHeader';
import PredictiveInsightsCard from '@/components/insights/PredictiveInsightsCard';
import { EnhancedInsightsView } from '@/components/insights';
import { Description, Download, Psychology, Analytics } from '@mui/icons-material';
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
  
  // Predictive Insights State
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsights | null>(null);
  const [predictiveInsightsLoading, setPredictiveInsightsLoading] = useState(false);
  const [predictiveInsightsError, setPredictiveInsightsError] = useState<string | null>(null);
  
  // Customer-specific CSAT insights (separate from org-level insights passed as prop)
  const [customerCsatInsights, setCustomerCsatInsights] = useState<any | null>(null);

  // Load Predictive Insights
  const loadPredictiveInsights = async () => {
    try {
      setPredictiveInsightsLoading(true);
      setPredictiveInsightsError(null);
      
      const predictiveRes = await insightsService.getPredictiveInsights();
      setPredictiveInsights(predictiveRes.data);
    } catch (error) {
      console.error('Error loading predictive insights:', error);
      setPredictiveInsightsError('Failed to load predictive insights');
    } finally {
      setPredictiveInsightsLoading(false);
    }
  };

  // Load predictive insights on component mount
  useEffect(() => {
    loadPredictiveInsights();
  }, []);

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
        loading={loading || predictiveInsightsLoading}
        onRefresh={() => {
          onRefresh();
          loadPredictiveInsights();
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
            </Box>
          )}
        </Box>
      )}

      {activeSubTab === 1 && (
        <Box>
          {predictiveInsightsError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {predictiveInsightsError}
            </Alert>
          )}
          {predictiveInsightsLoading ? (
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
