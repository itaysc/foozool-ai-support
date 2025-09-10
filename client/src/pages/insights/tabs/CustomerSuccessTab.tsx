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
  selectedCustomer: string | null;
  customers: any[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCustomerChange: (customerId: string) => void;
}

const CustomerSuccessTab: React.FC<CustomerSuccessTabProps> = ({
  csInsights,
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
            
            return (
              <Box key={category} sx={{ mb: 2 }}>
                <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  {categoryInsights.map((insight, index) => (
                    <Box key={`${insight.type}-${index}`} sx={{ 
                      mb: 1,
                      position: 'relative',
                      border: `1px solid ${
                        insight.severity === 'red' ? '#f44336' : 
                        insight.severity === 'yellow' ? '#ff9800' : '#2196f3'
                      }`,
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
                        color: category === 'risk' ? 'error.main' : 
                               category === 'upsell' ? 'success.main' :
                               category === 'customer_success' ? 'primary.main' : 'secondary.main'
                      }}>
                        {categoryLabels[category as keyof typeof categoryLabels]}
                      </Typography>
                      
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
                          backgroundColor: 'grey.50', 
                          p: 0.75, 
                          borderRadius: 0.5, 
                          border: '1px solid',
                          borderColor: 'grey.200',
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
                </Paper>
              </Box>
            );
          })}
        </Box>
      )}

      {selectedCustomer && csInsights.length === 0 && (
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
