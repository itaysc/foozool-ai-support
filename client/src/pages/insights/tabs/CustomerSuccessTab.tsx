import React, { useState } from 'react';
import { Box, Typography, Alert, Card, CardContent, Button, Select, MenuItem, FormControl, InputLabel, Paper, Divider, Chip, CircularProgress } from '@mui/material';
import { CustomerSuccessInsight } from '@/types/customerSuccess';
import MetricCard from '@/components/insights/MetricCard';
import InsightCard from '@/components/insights/InsightCard';
import PageHeader from '@/components/insights/PageHeader';
import { Description, Download } from '@mui/icons-material';
import { insightsService } from '@/services/insights-service';

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
  const [meetingPrepLoading, setMeetingPrepLoading] = useState(false);

  const generateMeetingPrepDocument = async () => {
    if (!selectedCustomer) {
      alert('Please select a specific customer to generate a meeting prep document.');
      return;
    }

    try {
      setMeetingPrepLoading(true);
      const blob = await insightsService.generateCustomerMeetingPrep(selectedCustomer);
      
      // Get customer name for filename
      const customer = customers.find(c => c._id === selectedCustomer);
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
    } catch (error) {
      console.error('Error generating meeting prep document:', error);
      alert('Failed to generate meeting prep document. Please try again.');
    } finally {
      setMeetingPrepLoading(false);
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const categories = ['risk', 'upsell', 'customer_success', 'strategic'];
  const categoryLabels = {
    'risk': '🔴 Risk & Red Alerts',
    'upsell': '🟢 Upsell & Expansion',
    'customer_success': '🔵 Customer Success & Prep',
    'strategic': '🟣 Strategic & Predictive'
  };

  return (
    <Box>
      <PageHeader
        title="Customer Success Insights"
        subtitle="AI-powered customer success analysis and recommendations"
        loading={loading}
        onRefresh={onRefresh}
        actionButton={
          <Button
            variant="contained"
            startIcon={meetingPrepLoading ? <CircularProgress size={16} color="inherit" /> : <Description />}
            onClick={generateMeetingPrepDocument}
            disabled={!selectedCustomer || meetingPrepLoading}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
              '&:disabled': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                opacity: 0.7
              }
            }}
          >
            {meetingPrepLoading ? 'Generating...' : 'Meeting Prep'}
          </Button>
        }
      />

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Select Customer
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Choose a customer</InputLabel>
            <Select
              value={selectedCustomer || ''}
              onChange={(e) => onCustomerChange(e.target.value)}
              label="Choose a customer"
            >
              {customers.map((customer) => (
                <MenuItem key={customer._id} value={customer._id}>
                  {customer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {selectedCustomer && csInsights.length > 0 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            Customer Success Insights
          </Typography>
          
          {categories.map((category) => {
            const categoryInsights = csInsights.filter(insight => insight.category === category);
            if (categoryInsights.length === 0) return null;
            
            // Get category color
            const categoryColor = category === 'risk' ? '#f44336' : 
                                 category === 'upsell' ? '#4caf50' :
                                 category === 'customer_success' ? '#2196f3' : '#9c27b0';
            
            return (
              <Box key={category} sx={{ 
                mb: 2,
                position: 'relative',
                border: `1px solid ${categoryColor}`,
                borderRadius: 1,
                backgroundColor: 'white',
                p: 1.5,
                '&:hover': {
                  boxShadow: 1
                }
              }}>
                {/* Floating label on top border */}
                <Typography variant="caption" sx={{
                  position: 'absolute',
                  top: -8,
                  left: 8,
                  backgroundColor: 'white',
                  px: 1,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  color: categoryColor
                }}>
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </Typography>
                
                {/* Insights content */}
                {categoryInsights.map((insight, index) => (
                  <Box key={`${insight.type}-${index}`} sx={{ 
                    mb: index < categoryInsights.length - 1 ? 1 : 0,
                    p: 1,
                    backgroundColor: 'grey.50',
                    borderRadius: 0.5,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    {/* Main content row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ 
                          fontWeight: 600, 
                          textTransform: 'capitalize',
                          fontSize: '0.8rem',
                          mr: 1
                        }}>
                          {insight.type.replace(/_/g, ' ')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          fontSize: '0.75rem',
                          flex: 1
                        }}>
                          {insight.message}
                        </Typography>
                      </Box>
                      <Chip 
                        label={insight.severity.toUpperCase()}
                        color={insight.severity === 'red' ? 'error' : insight.severity === 'yellow' ? 'warning' : 'info'}
                        size="small"
                        sx={{ ml: 1, fontSize: '0.65rem', height: '18px' }}
                      />
                    </Box>
                    
                    {/* Meta data if available */}
                    {insight.meta && Object.keys(insight.meta).length > 0 && (
                      <Box sx={{ 
                        backgroundColor: 'white', 
                        p: 0.75, 
                        borderRadius: 0.5, 
                        border: '1px solid',
                        borderColor: 'grey.300',
                        mt: 0.5
                      }}>
                        {Object.entries(insight.meta).map(([key, value]) => (
                          <Typography key={key} variant="caption" color="text.secondary" sx={{ 
                            fontSize: '0.65rem',
                            display: 'block'
                          }}>
                            <strong>{key.replace(/_/g, ' ')}:</strong> {String(value)}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            );
          })}
        </Box>
      )}

      {/* CSAT Insights Section */}
      {csatInsights && (
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
                  label={`${csatInsights.currentCSAT || 0}%`}
                  color={csatInsights.currentCSAT >= 80 ? 'success' : csatInsights.currentCSAT >= 60 ? 'warning' : 'error'}
                  sx={{ fontSize: '1rem', fontWeight: 600, px: 2, py: 1 }}
                />
              </Box>
              
              {csatInsights.csatChange && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Change from previous period: {csatInsights.csatChange > 0 ? '+' : ''}{csatInsights.csatChange}%
                </Typography>
              )}
              
              <Typography variant="body2" color="text.secondary">
                Total Responses: {csatInsights.totalResponses || 0} | 
                Response Rate: {csatInsights.responseRate || 0}%
              </Typography>
            </CardContent>
          </Card>

          {/* CSAT Insights */}
          {csatInsights.insights && csatInsights.insights.length > 0 && (
            <Card sx={{ mb: 3, border: '1px solid #2196f3' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2196f3' }}>
                  Key Insights
                </Typography>
                {csatInsights.insights.map((insight: string, index: number) => (
                  <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2">
                      • {insight}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* CSAT Recommendations */}
          {csatInsights.recommendations && csatInsights.recommendations.length > 0 && (
            <Card sx={{ mb: 3, border: '1px solid #4caf50' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#4caf50' }}>
                  Recommendations
                </Typography>
                {csatInsights.recommendations.map((recommendation: string, index: number) => (
                  <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: '#f1f8e9', borderRadius: 1 }}>
                    <Typography variant="body2">
                      • {recommendation}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Score Distribution */}
          {csatInsights.scoreDistribution && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Score Distribution
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {Object.entries(csatInsights.scoreDistribution).map(([score, count]) => (
                    <Box key={score} sx={{ textAlign: 'center', minWidth: '60px' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Score {score}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {selectedCustomer && csInsights.length === 0 && !csatInsights && (
        <Alert severity="info">
          No customer success insights available for the selected customer. Generate insights to see AI-powered analysis.
        </Alert>
      )}

      {!selectedCustomer && (
        <Alert severity="info">
          Please select a customer to view their customer success insights.
        </Alert>
      )}
    </Box>
  );
};

export default CustomerSuccessTab;
