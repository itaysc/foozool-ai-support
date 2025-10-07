import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Card, CardContent, Chip } from '@mui/material';
import { CustomerSuccessInsight } from '@/types/customerSuccess';
import { EnhancedInsightsView } from '@/components/insights';
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
  
  // Customer-specific CSAT insights (separate from org-level insights passed as prop)
  const [customerCsatInsights, setCustomerCsatInsights] = useState<any | null>(null);



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


  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }


  return (
    <Box>
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
                    onMeetingPrepClick={handleOpenMeetingPrepModal}
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
