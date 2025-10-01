import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Card, CardContent, Button, Select, MenuItem, FormControl, InputLabel, Paper, Divider, Chip, CircularProgress, Tabs, Tab } from '@mui/material';
import { CustomerSuccessInsight } from '@/types/customerSuccess';
import { DataIntelligenceMetrics, HealthScoreFactors, HealthScoresResponse, PredictiveInsights, CustomerDataIntelligence } from '@/types/dataIntelligence';
import MetricCard from '@/components/insights/MetricCard';
import InsightCard from '@/components/insights/InsightCard';
import PageHeader from '@/components/insights/PageHeader';
import DataIntelligenceDashboard from '@/components/insights/DataIntelligenceDashboard';
import HealthScoreCard from '@/components/insights/HealthScoreCard';
import HealthScoresList from '@/components/insights/HealthScoresList';
import PredictiveInsightsCard from '@/components/insights/PredictiveInsightsCard';
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
          <Tab 
            icon={<Analytics />} 
            label="Customer Insights" 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          />
        </Tabs>
      </Box>

      {/* Customer Selection - only show for customer-specific tabs */}
      {(activeSubTab === 2 || activeSubTab === 3) && (
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
      )}

      {/* Tab Content */}
      {activeSubTab === 0 && (
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
          ) : allHealthScores ? (
            <HealthScoresList healthScores={allHealthScores} />
          ) : (
            <Alert severity="info">
              No health scores available. Please try refreshing the page.
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
          ) : predictiveInsights ? (
            <PredictiveInsightsCard insights={predictiveInsights} />
          ) : (
            <Alert severity="info">
              No predictive insights available. Please try refreshing the page.
            </Alert>
          )}
        </Box>
      )}

      {activeSubTab === 3 && (
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
                  {/* Customer Health Score */}
                  {customerHealthScore && (
                    <Box sx={{ mb: 4 }}>
                      <HealthScoreCard 
                        healthScore={customerHealthScore} 
                        customerName={customers.find(c => c._id === selectedCustomer)?.name}
                      />
                    </Box>
                  )}

                  {/* Customer Success Insights */}
                  {csInsights.length > 0 && (
                    <Box sx={{ mb: 4 }}>
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
                                    {Object.entries(insight.meta).map(([key, value]) => {
                                      // Debug logging
                                      if (key === 'stakeholders') {
                                        console.log('Stakeholder data:', value);
                                      }
                                      
                                      // Handle different value types properly
                                      const formatValue = (val: any): string => {
                                        if (val === null || val === undefined) return 'N/A';
                                        if (typeof val === 'object') {
                                          if (Array.isArray(val)) {
                                            if (val.length === 0) return 'None';
                                            // Handle array of objects (like stakeholders)
                                            return val.map(item => {
                                              if (typeof item === 'object') {
                                                // Special handling for influencer expansion opportunity - show name, title and department
                                                if (key === 'stakeholders' && insight.type === 'influencer_expansion_opportunity') {
                                                  const name = item.name || 'Unknown Name';
                                                  const title = item.title || 'Unknown Title';
                                                  const department = item.department || 'Unknown Dept';
                                                  return `${name} ${title} (${department})`;
                                                }
                                                // Default behavior for other cases
                                                return Object.entries(item)
                                                  .map(([k, v]) => `${k}: ${v}`)
                                                  .join(', ');
                                              }
                                              return String(item);
                                            }).join(' | ');
                                          }
                                          // For objects, show key-value pairs
                                          return Object.entries(val)
                                            .map(([k, v]) => `${k}: ${v}`)
                                            .join(', ');
                                        }
                                        return String(val);
                                      };

                                      return (
                                        <Typography key={key} variant="caption" color="text.secondary" sx={{ 
                                          fontSize: '0.65rem',
                                          display: 'block'
                                        }}>
                                          <strong>{key.replace(/_/g, ' ')}:</strong> {formatValue(value)}
                                        </Typography>
                                      );
                                    })}
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

                      {/* CSAT Insights */}
                      {customerCsatInsights.insights && customerCsatInsights.insights.length > 0 && (
                        <Card sx={{ mb: 3, border: '1px solid #2196f3' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2196f3' }}>
                              Key Insights
                            </Typography>
                            {customerCsatInsights.insights.map((insight: string, index: number) => (
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
                      {customerCsatInsights.recommendations && customerCsatInsights.recommendations.length > 0 && (
                        <Card sx={{ mb: 3, border: '1px solid #4caf50' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#4caf50' }}>
                              Recommendations
                            </Typography>
                            {customerCsatInsights.recommendations.map((recommendation: string, index: number) => (
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
                      {customerCsatInsights.scoreDistribution && (
                        <Card sx={{ mb: 3 }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              Score Distribution
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              {Object.entries(customerCsatInsights.scoreDistribution).map(([score, count]) => {
                                const countValue = typeof count === 'number' ? count : 0;
                                return (
                                  <Box key={score} sx={{ textAlign: 'center', minWidth: '60px' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                      {countValue}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Score {score}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          </CardContent>
                        </Card>
                      )}
                    </Box>
                  )}

                  {csInsights.length === 0 && !customerCsatInsights && !customerHealthScore && (
                    <Alert severity="info">
                      No customer success insights available for the selected customer. Generate insights to see AI-powered analysis.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
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
