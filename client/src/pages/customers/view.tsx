import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Edit,
  ArrowBack,
  Business,
  Person,
  Email,
  Phone,
  Language,
  CalendarToday,
  TrendingUp,
  Assessment,
  LocationOn,
  AttachMoney,
  Group,
  Public,
  AccountBalance,
  Work,
  Payment,
  Security,
  Speed,
  Timer,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { observer } from 'mobx-react';
import customersStore from '@/stores/customers.store';
import { ICustomer } from '@/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const getHealthScoreColor = (score: number) => {
  if (score >= 8) return '#10b981';
  if (score >= 6) return '#f59e0b';
  if (score >= 4) return '#3b82f6';
  return '#ef4444';
};

const getHealthScoreLabel = (score: number) => {
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Fair';
  return 'At Risk';
};

const getPaymentReliabilityColor = (reliability?: string) => {
  switch (reliability) {
    case 'excellent': return 'success';
    case 'good': return 'info';
    case 'fair': return 'warning';
    case 'poor': return 'error';
    default: return 'default';
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'success';
    case 'pending': return 'warning';
    case 'overdue': return 'error';
    case 'failed': return 'error';
    default: return 'default';
  }
};

const InfoField: React.FC<{ label: string; value: React.ReactNode; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2.5 }}>
    {icon && (
      <Box sx={{ mt: 0.5, color: 'primary.main' }}>
        {icon}
      </Box>
    )}
    <Box sx={{ flex: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
        {value || <span style={{ color: '#9ca3af' }}>Not specified</span>}
      </Typography>
    </Box>
  </Box>
);

const SectionTitle: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
    {icon && <Box sx={{ color: 'primary.main' }}>{icon}</Box>}
    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
      {children}
    </Typography>
  </Box>
);

const CustomerViewPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomer = async () => {
      if (!customerId) {
        setError('No customer ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        await customersStore.fetchCustomerById(customerId);
        const customerData = customersStore.currentCustomer;
        
        if (customerData) {
          setCustomer(customerData);
        } else {
          setError('Customer not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load customer');
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomer();
  }, [customerId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (error || !customer) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/customers')}
          sx={{ mb: 2 }}
        >
          Back to Customers
        </Button>
        <Alert severity="error">{error || 'Customer not found'}</Alert>
      </Box>
    );
  }

  const usagePercentage = customer.usageData?.seatsPurchased 
    ? ((customer.usageData.seatsUsed || 0) / customer.usageData.seatsPurchased) * 100 
    : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/customers')}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Customers
        </Button>
        
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {customer.name}
              </Typography>
              {customer.healthScore !== undefined && (
                <Box sx={{ 
                  px: 2, 
                  py: 0.5, 
                  borderRadius: 2, 
                  bgcolor: `${getHealthScoreColor(customer.healthScore)}15`,
                  border: `2px solid ${getHealthScoreColor(customer.healthScore)}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Assessment sx={{ color: getHealthScoreColor(customer.healthScore), fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: getHealthScoreColor(customer.healthScore) }}>
                    {customer.healthScore}/10 - {getHealthScoreLabel(customer.healthScore)}
                  </Typography>
                </Box>
              )}
            </Box>
            <Box display="flex" gap={1.5} flexWrap="wrap" mt={1.5}>
              {customer.segment && (
                <Chip label={customer.segment} color="primary" size="small" />
              )}
              {customer.industry && (
                <Chip icon={<Business />} label={customer.industry} variant="outlined" size="small" />
              )}
              {customer.companySize && (
                <Chip icon={<Group />} label={customer.companySize} variant="outlined" size="small" />
              )}
            </Box>
          </Box>
          <Box display="flex" gap={1.5}>
            <Button
              variant="outlined"
              startIcon={<Assessment />}
              onClick={() => navigate(`/customers/${customer._id}/dashboard`)}
              size="large"
            >
              Dashboard
            </Button>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate(`/customers/edit/${customer._id}`)}
              size="large"
            >
              Edit Customer
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: '220px', boxShadow: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: 'primary.main', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AttachMoney sx={{ fontSize: 28 }} />
              </Box>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Contract Value
                </Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>
                  {customer.financialMetrics?.contractValue 
                    ? `$${customer.financialMetrics.contractValue.toLocaleString()}` 
                    : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: '220px', boxShadow: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: 'info.main', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CalendarToday sx={{ fontSize: 28 }} />
              </Box>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Customer Since
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>
                  {customer.startDate ? new Date(customer.startDate).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: '220px', boxShadow: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: 'success.main', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp sx={{ fontSize: 28 }} />
              </Box>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  MRR
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>
                  {customer.financialMetrics?.monthlyRecurringRevenue 
                    ? `$${customer.financialMetrics.monthlyRecurringRevenue.toLocaleString()}` 
                    : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: '220px', boxShadow: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: 'warning.main', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Person sx={{ fontSize: 28 }} />
              </Box>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Active Users
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>
                  {customer.usageData?.activeUsersCount ?? 'N/A'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Paper sx={{ boxShadow: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            px: 2,
            '& .MuiTab-root': { fontWeight: 600 }
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="General" />
          <Tab label="Geo & Operations" />
          <Tab label="Media & Signals" />
          <Tab label="Usage & Activity" />
          <Tab label="Financial" />
          <Tab label="Customer Success" />
          <Tab label="Success Metrics" />
          <Tab label="Capacity & Growth" />
          <Tab label="Stakeholders" />
          <Tab label="SLAs" />
        </Tabs>

        {/* General Tab */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ px: 3 }}>
            <SectionTitle icon={<Business />}>Company Information</SectionTitle>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              <Box flex={1} minWidth="300px">
                <InfoField 
                  label="Company Name" 
                  value={customer.name}
                  icon={<Business fontSize="small" />}
                />
                <InfoField 
                  label="Industry" 
                  value={customer.industry}
                  icon={<Work fontSize="small" />}
                />
                <InfoField 
                  label="Company Size" 
                  value={customer.companySize}
                  icon={<Group fontSize="small" />}
                />
                <InfoField 
                  label="Customer Segment" 
                  value={customer.segment}
                  icon={<Assessment fontSize="small" />}
                />
              </Box>

              <Box flex={1} minWidth="300px">
                <InfoField 
                  label="Website" 
                  value={customer.website ? (
                    <a href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                      {customer.website}
                    </a>
                  ) : undefined}
                  icon={<Language fontSize="small" />}
                />
                <InfoField 
                  label="Account Manager" 
                  value={customer.accountManager}
                  icon={<Person fontSize="small" />}
                />
                <InfoField 
                  label="Health Score" 
                  value={customer.healthScore ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1" fontWeight="bold" color={getHealthScoreColor(customer.healthScore)}>
                        {customer.healthScore}/10
                      </Typography>
                      <Chip 
                        label={getHealthScoreLabel(customer.healthScore)} 
                        size="small" 
                        sx={{ 
                          bgcolor: `${getHealthScoreColor(customer.healthScore)}15`,
                          color: getHealthScoreColor(customer.healthScore),
                          fontWeight: 600
                        }}
                      />
                    </Box>
                  ) : undefined}
                  icon={<Assessment fontSize="small" />}
                />
              </Box>
            </Box>

            {customer.domains && customer.domains.length > 0 && (
              <>
                <Divider sx={{ my: 4 }} />
                <SectionTitle>Domains</SectionTitle>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {customer.domains.map((domain, index) => (
                    <Chip key={index} label={domain} variant="outlined" />
                  ))}
                </Box>
              </>
            )}

            {customer.notes && (
              <>
                <Divider sx={{ my: 4 }} />
                <SectionTitle>Notes</SectionTitle>
                <Paper variant="outlined" sx={{ p: 3, bgcolor: 'grey.50' }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                    {customer.notes}
                  </Typography>
                </Paper>
              </>
            )}
          </Box>
        </TabPanel>

        {/* Geo & Operations Tab */}
        <TabPanel value={currentTab} index={1}>
          <Box sx={{ px: 3 }}>
            <SectionTitle icon={<LocationOn />}>Headquarters</SectionTitle>
            
            {customer.hq ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mb: 4 }}>
                <InfoField label="Country" value={customer.hq.country} />
                {customer.hq.region && <InfoField label="Region" value={customer.hq.region} />}
                {customer.hq.state && <InfoField label="State" value={customer.hq.state} />}
                {customer.hq.city && <InfoField label="City" value={customer.hq.city} />}
                {customer.hq.lat !== undefined && customer.hq.lon !== undefined && (
                  <InfoField label="Coordinates" value={`${customer.hq.lat}, ${customer.hq.lon}`} />
                )}
              </Box>
            ) : (
              <Typography color="text.secondary" sx={{ mb: 4 }}>No headquarters information available</Typography>
            )}

            <Divider sx={{ my: 4 }} />

            <SectionTitle icon={<Public />}>Global Operations</SectionTitle>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              <Box flex={1} minWidth="300px">
                {customer.operatingRegions && customer.operatingRegions.length > 0 ? (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                      Operating Regions
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {customer.operatingRegions.map((region, index) => (
                        <Chip key={index} label={region} size="small" color="primary" variant="outlined" />
                      ))}
                    </Box>
                  </>
                ) : (
                  <Typography color="text.secondary">No operating regions specified</Typography>
                )}
              </Box>

              <Box flex={1} minWidth="300px">
                {customer.countriesServed && customer.countriesServed.length > 0 ? (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                      Countries Served
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {customer.countriesServed.map((country, index) => (
                        <Chip key={index} label={country} size="small" color="info" variant="outlined" />
                      ))}
                    </Box>
                  </>
                ) : (
                  <Typography color="text.secondary">No countries specified</Typography>
                )}
              </Box>
            </Box>

            {customer.languages && customer.languages.length > 0 && (
              <>
                <Divider sx={{ my: 4 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                  Supported Languages
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {customer.languages.map((language, index) => (
                    <Chip key={index} label={language} size="small" variant="outlined" />
                  ))}
                </Box>
              </>
            )}

            {customer.publicListing?.isPublic && (
              <>
                <Divider sx={{ my: 4 }} />
                <SectionTitle icon={<Public />}>Public Listing</SectionTitle>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <InfoField label="Public Company" value="Yes" />
                  {customer.publicListing.ticker && <InfoField label="Ticker Symbol" value={customer.publicListing.ticker} />}
                  {customer.publicListing.exchange && <InfoField label="Exchange" value={customer.publicListing.exchange} />}
                </Box>
              </>
            )}
          </Box>
        </TabPanel>

        {/* Media & Signals Tab */}
        <TabPanel value={currentTab} index={2}>
          <Box sx={{ px: 3 }}>
            <SectionTitle>Media Monitoring Configuration</SectionTitle>

            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 4 }}>
              <InfoField 
                label="Default Lookback Period" 
                value={customer.mediaLookbackDaysDefault ? `${customer.mediaLookbackDaysDefault} days` : undefined}
              />
            </Box>

            {customer.newsKeywords && customer.newsKeywords.length > 0 && (
              <>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                  News Keywords
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" sx={{ mb: 3 }}>
                  {customer.newsKeywords.map((keyword, index) => (
                    <Chip key={index} label={keyword} size="small" color="primary" />
                  ))}
                </Box>
              </>
            )}

            {customer.excludedKeywords && customer.excludedKeywords.length > 0 && (
              <>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                  Excluded Keywords
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" sx={{ mb: 3 }}>
                  {customer.excludedKeywords.map((keyword, index) => (
                    <Chip key={index} label={keyword} size="small" color="error" variant="outlined" />
                  ))}
                </Box>
              </>
            )}

            {customer.competitorNames && customer.competitorNames.length > 0 && (
              <>
                <Divider sx={{ my: 4 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                  Competitors
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" sx={{ mb: 3 }}>
                  {customer.competitorNames.map((competitor, index) => (
                    <Chip key={index} label={competitor} size="small" color="warning" variant="outlined" />
                  ))}
                </Box>
              </>
            )}

            {customer.productLines && customer.productLines.length > 0 && (
              <>
                <Divider sx={{ my: 4 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                  Product Lines
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" sx={{ mb: 3 }}>
                  {customer.productLines.map((product, index) => (
                    <Chip key={index} label={product} size="small" color="success" variant="outlined" />
                  ))}
                </Box>
              </>
            )}

            {customer.contentSources && customer.contentSources.length > 0 && (
              <>
                <Divider sx={{ my: 4 }} />
                <SectionTitle>Content Sources</SectionTitle>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>URL / Handle</TableCell>
                        <TableCell>Note</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customer.contentSources.map((source, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip label={source.type} size="small" />
                          </TableCell>
                          <TableCell>{source.handleOrUrl}</TableCell>
                          <TableCell>{source.note || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        </TabPanel>

        {/* Usage & Activity Tab */}
        <TabPanel value={currentTab} index={3}>
          <Box sx={{ px: 3 }}>
            <SectionTitle icon={<Speed />}>Usage Statistics</SectionTitle>

            {customer.usageData ? (
              <>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 4 }}>
                  <Card sx={{ flex: 1, minWidth: '200px' }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Active Users
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                        {customer.usageData.activeUsersCount ?? 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card sx={{ flex: 1, minWidth: '200px' }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Seats Purchased
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                        {customer.usageData.seatsPurchased ?? 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card sx={{ flex: 1, minWidth: '200px' }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Seats Used
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                        {customer.usageData.seatsUsed ?? 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                {customer.usageData.seatsPurchased && (
                  <Box sx={{ mb: 4 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Seat Utilization
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {usagePercentage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(usagePercentage, 100)} 
                      sx={{ height: 10, borderRadius: 1 }}
                    />
                  </Box>
                )}
              </>
            ) : (
              <Alert severity="info">No usage data available</Alert>
            )}

            <Divider sx={{ my: 4 }} />

            <Typography variant="body2" color="text.secondary">
              Detailed activity tracking including ticket history, support interactions, and engagement metrics will be displayed here.
            </Typography>
          </Box>
        </TabPanel>

        {/* Financial Tab */}
        <TabPanel value={currentTab} index={4}>
          <Box sx={{ px: 3 }}>
            <SectionTitle icon={<AccountBalance />}>Financial Overview</SectionTitle>

            {customer.financialMetrics ? (
              <>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                  <Card sx={{ flex: 1, minWidth: '200px', boxShadow: 2 }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Annual Recurring Revenue
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                        {customer.financialMetrics.annualRecurringRevenue 
                          ? `$${customer.financialMetrics.annualRecurringRevenue.toLocaleString()}` 
                          : 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card sx={{ flex: 1, minWidth: '200px', boxShadow: 2 }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Monthly Recurring Revenue
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                        {customer.financialMetrics.monthlyRecurringRevenue 
                          ? `$${customer.financialMetrics.monthlyRecurringRevenue.toLocaleString()}` 
                          : 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card sx={{ flex: 1, minWidth: '200px', boxShadow: 2 }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Contract Value
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                        {customer.financialMetrics.contractValue 
                          ? `$${customer.financialMetrics.contractValue.toLocaleString()}` 
                          : 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card sx={{ 
                    flex: 1, 
                    minWidth: '200px', 
                    boxShadow: 2,
                    bgcolor: customer.financialMetrics.outstandingBalance && customer.financialMetrics.outstandingBalance > 0 ? 'error.light' : undefined
                  }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Outstanding Balance
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                        {customer.financialMetrics.outstandingBalance !== undefined
                          ? `$${customer.financialMetrics.outstandingBalance.toLocaleString()}` 
                          : 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Divider sx={{ my: 4 }} />

                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 4 }}>
                  <Box flex={1} minWidth="250px">
                    <InfoField 
                      label="Contract Renewal Date" 
                      value={customer.financialMetrics.contractRenewalDate 
                        ? new Date(customer.financialMetrics.contractRenewalDate).toLocaleDateString() 
                        : undefined}
                      icon={<CalendarToday fontSize="small" />}
                    />
                    <InfoField 
                      label="Payment Terms" 
                      value={customer.financialMetrics.paymentTerms}
                      icon={<Payment fontSize="small" />}
                    />
                    <InfoField 
                      label="Last Payment Date" 
                      value={customer.financialMetrics.lastPaymentDate 
                        ? new Date(customer.financialMetrics.lastPaymentDate).toLocaleDateString() 
                        : undefined}
                      icon={<CheckCircle fontSize="small" />}
                    />
                  </Box>

                  <Box flex={1} minWidth="250px">
                    <InfoField 
                      label="Credit Score" 
                      value={customer.financialMetrics.creditScore}
                      icon={<Security fontSize="small" />}
                    />
                    <InfoField 
                      label="Average Payment Days" 
                      value={customer.financialMetrics.averagePaymentDays}
                      icon={<Timer fontSize="small" />}
                    />
                    <InfoField 
                      label="Payment Reliability" 
                      value={customer.financialMetrics.paymentReliability ? (
                        <Chip 
                          label={customer.financialMetrics.paymentReliability.charAt(0).toUpperCase() + customer.financialMetrics.paymentReliability.slice(1)} 
                          color={getPaymentReliabilityColor(customer.financialMetrics.paymentReliability) as any}
                          size="small"
                        />
                      ) : undefined}
                      icon={<Assessment fontSize="small" />}
                    />
                  </Box>
                </Box>

                {customer.financialMetrics.paymentHistory && customer.financialMetrics.paymentHistory.length > 0 && (
                  <>
                    <Divider sx={{ my: 4 }} />
                    <SectionTitle icon={<Payment />}>Payment History</SectionTitle>
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {customer.financialMetrics.paymentHistory.map((payment, index) => (
                            <TableRow key={index} hover>
                              <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>${payment.amount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={payment.status.charAt(0).toUpperCase() + payment.status.slice(1)} 
                                  color={getPaymentStatusColor(payment.status) as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{payment.method || '-'}</TableCell>
                              <TableCell>{payment.invoiceNumber || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </>
            ) : (
              <Alert severity="info">No financial data available</Alert>
            )}
          </Box>
        </TabPanel>

        {/* Customer Success Tab */}
        <TabPanel value={currentTab} index={5}>
          <Box sx={{ px: 3 }}>
            <SectionTitle icon={<TrendingUp />}>Customer Health</SectionTitle>
            
            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Health Score</Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography 
                      variant="h3" 
                      fontWeight="bold"
                      color={customer.healthScore && customer.healthScore >= 70 ? 'success.main' : 
                            customer.healthScore && customer.healthScore >= 40 ? 'warning.main' : 'error.main'}
                    >
                      {customer.healthScore || 'N/A'}
                    </Typography>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {customer.healthScore && customer.healthScore >= 70 ? 'Healthy' : 
                         customer.healthScore && customer.healthScore >= 40 ? 'At Risk' : 'Critical'}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={customer.healthScore || 0} 
                        sx={{ mt: 1, height: 8, borderRadius: 4 }}
                        color={customer.healthScore && customer.healthScore >= 70 ? 'success' : 
                               customer.healthScore && customer.healthScore >= 40 ? 'warning' : 'error'}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Account Manager</Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {customer.accountManager || 'Not Assigned'}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <SectionTitle icon={<Assessment />}>Success Definition & Satisfaction Benchmarks</SectionTitle>
            
            {customer.successCriteria?.successDefinition && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Success Definition</Typography>
                  <Typography variant="body1">
                    {customer.successCriteria.successDefinition}
                  </Typography>
                </CardContent>
              </Card>
            )}

            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
              {customer.successCriteria?.satisfactionBenchmarks?.nps && (
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Net Promoter Score (NPS)</Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="h4" fontWeight="bold" color="primary">
                        {customer.successCriteria.satisfactionBenchmarks.nps.current || 'N/A'}
                      </Typography>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Target: {customer.successCriteria.satisfactionBenchmarks.nps.target || 'N/A'}
                        </Typography>
                        {customer.successCriteria.satisfactionBenchmarks.nps.lastUpdated && (
                          <Typography variant="caption" color="text.secondary">
                            Updated: {new Date(customer.successCriteria.satisfactionBenchmarks.nps.lastUpdated).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {customer.successCriteria?.satisfactionBenchmarks?.csat && (
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Customer Satisfaction (CSAT)</Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="h4" fontWeight="bold" color="primary">
                        {customer.successCriteria.satisfactionBenchmarks.csat.current || 'N/A'}
                      </Typography>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Target: {customer.successCriteria.satisfactionBenchmarks.csat.target || 'N/A'}
                        </Typography>
                        {customer.successCriteria.satisfactionBenchmarks.csat.lastUpdated && (
                          <Typography variant="caption" color="text.secondary">
                            Updated: {new Date(customer.successCriteria.satisfactionBenchmarks.csat.lastUpdated).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Box>
        </TabPanel>

        {/* Success Metrics Tab */}
        <TabPanel value={currentTab} index={6}>
          <Box sx={{ px: 3 }}>
            <SectionTitle icon={<Assessment />}>Primary Business Metrics</SectionTitle>
            
            {customer.successCriteria?.primaryMetrics && customer.successCriteria.primaryMetrics.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                {customer.successCriteria.primaryMetrics.map((metric, index) => (
                  <Card key={index} sx={{ boxShadow: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold">
                          {metric.name}
                        </Typography>
                        <Chip 
                          label={metric.importance} 
                          size="small" 
                          color={metric.importance === 'critical' ? 'error' : 
                                 metric.importance === 'high' ? 'warning' : 'default'}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Current</Typography>
                          <Typography variant="h5" fontWeight="bold" color="primary">
                            {metric.currentValue} {metric.unit}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Target</Typography>
                          <Typography variant="h5" fontWeight="bold">
                            {metric.targetValue} {metric.unit}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Performance</Typography>
                          <Typography variant="h5" fontWeight="bold" 
                            color={metric.currentValue >= metric.targetValue * 0.9 ? 'success.main' : 
                                   metric.currentValue >= metric.targetValue * 0.7 ? 'warning.main' : 'error.main'}>
                            {((metric.currentValue / metric.targetValue) * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Alert severity="info" sx={{ mb: 3 }}>No primary business metrics defined</Alert>
            )}

            <SectionTitle icon={<TrendingUp />}>Key Performance Indicators (KPIs)</SectionTitle>
            
            {customer.successCriteria?.kpis && customer.successCriteria.kpis.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                {customer.successCriteria.kpis.map((kpi, index) => (
                  <Card key={index} sx={{ boxShadow: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold">
                          {kpi.name}
                        </Typography>
                        <Chip 
                          label={kpi.measurementPeriod} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Current</Typography>
                          <Typography variant="h5" fontWeight="bold" color="primary">
                            {kpi.currentValue} {kpi.unit}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Target</Typography>
                          <Typography variant="h5" fontWeight="bold">
                            {kpi.targetValue} {kpi.unit}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Performance</Typography>
                          <Typography variant="h5" fontWeight="bold" 
                            color={kpi.currentValue >= kpi.targetValue * 0.9 ? 'success.main' : 
                                   kpi.currentValue >= kpi.targetValue * 0.7 ? 'warning.main' : 'error.main'}>
                            {((kpi.currentValue / kpi.targetValue) * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Alert severity="info" sx={{ mb: 3 }}>No KPIs defined</Alert>
            )}

            <SectionTitle icon={<Assessment />}>Custom Satisfaction Metrics</SectionTitle>
            
            {customer.successCriteria?.satisfactionBenchmarks?.customMetrics && 
             customer.successCriteria.satisfactionBenchmarks.customMetrics.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {customer.successCriteria.satisfactionBenchmarks.customMetrics.map((metric, index) => (
                  <Card key={index} sx={{ boxShadow: 2 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {metric.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Current Score</Typography>
                          <Typography variant="h5" fontWeight="bold" color="primary">
                            {metric.current}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Target Score</Typography>
                          <Typography variant="h5" fontWeight="bold">
                            {metric.target}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Scale</Typography>
                          <Typography variant="h5" fontWeight="bold">
                            {metric.scale}
                          </Typography>
                        </Box>
                        {metric.lastUpdated && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {new Date(metric.lastUpdated).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Alert severity="info">No custom satisfaction metrics defined</Alert>
            )}
          </Box>
        </TabPanel>

        {/* Capacity & Growth Tab */}
        <TabPanel value={currentTab} index={7}>
          <Box sx={{ px: 3 }}>
            <SectionTitle icon={<Speed />}>Current Limits & Usage</SectionTitle>
            
            {customer.capacityGrowth?.currentLimits && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
                {/* Storage */}
                {customer.capacityGrowth.currentLimits.storage && (
                  <Card sx={{ boxShadow: 2 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>Storage</Typography>
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Current Usage</Typography>
                          <Typography variant="h5" fontWeight="bold" color="primary">
                            {customer.capacityGrowth.currentLimits.storage.current} {customer.capacityGrowth.currentLimits.storage.unit}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Limit</Typography>
                          <Typography variant="h5" fontWeight="bold">
                            {customer.capacityGrowth.currentLimits.storage.limit} {customer.capacityGrowth.currentLimits.storage.unit}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Utilization</Typography>
                          <Typography variant="h5" fontWeight="bold" 
                            color={((customer.capacityGrowth.currentLimits.storage.current / customer.capacityGrowth.currentLimits.storage.limit) * 100) > 90 ? 'error.main' : 
                                   ((customer.capacityGrowth.currentLimits.storage.current / customer.capacityGrowth.currentLimits.storage.limit) * 100) > 75 ? 'warning.main' : 'success.main'}>
                            {((customer.capacityGrowth.currentLimits.storage.current / customer.capacityGrowth.currentLimits.storage.limit) * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Users */}
                {customer.capacityGrowth.currentLimits.users && (
                  <Card sx={{ boxShadow: 2 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>Users</Typography>
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Current Users</Typography>
                          <Typography variant="h5" fontWeight="bold" color="primary">
                            {customer.capacityGrowth.currentLimits.users.current}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Limit</Typography>
                          <Typography variant="h5" fontWeight="bold">
                            {customer.capacityGrowth.currentLimits.users.limit}
                          </Typography>
                        </Box>
                        {customer.capacityGrowth.currentLimits.users.projectedGrowth && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">Projected Growth</Typography>
                            <Typography variant="h5" fontWeight="bold" color="warning.main">
                              +{customer.capacityGrowth.currentLimits.users.projectedGrowth}%
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Transactions */}
                {customer.capacityGrowth.currentLimits.transactions && (
                  <Card sx={{ boxShadow: 2 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>Transactions (Monthly)</Typography>
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Current</Typography>
                          <Typography variant="h5" fontWeight="bold" color="primary">
                            {customer.capacityGrowth.currentLimits.transactions.current.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Limit</Typography>
                          <Typography variant="h5" fontWeight="bold">
                            {customer.capacityGrowth.currentLimits.transactions.limit.toLocaleString()}
                          </Typography>
                        </Box>
                        {customer.capacityGrowth.currentLimits.transactions.peakUsage && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">Peak Usage</Typography>
                            <Typography variant="h5" fontWeight="bold" color="warning.main">
                              {customer.capacityGrowth.currentLimits.transactions.peakUsage.toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* API Calls */}
                {customer.capacityGrowth.currentLimits.apiCalls && (
                  <Card sx={{ boxShadow: 2 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>API Calls (Monthly)</Typography>
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Current</Typography>
                          <Typography variant="h5" fontWeight="bold" color="primary">
                            {customer.capacityGrowth.currentLimits.apiCalls.current.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Limit</Typography>
                          <Typography variant="h5" fontWeight="bold">
                            {customer.capacityGrowth.currentLimits.apiCalls.limit.toLocaleString()}
                          </Typography>
                        </Box>
                        {customer.capacityGrowth.currentLimits.apiCalls.projectedGrowth && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">Projected Growth</Typography>
                            <Typography variant="h5" fontWeight="bold" color="warning.main">
                              +{customer.capacityGrowth.currentLimits.apiCalls.projectedGrowth}%
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}

            <SectionTitle icon={<TrendingUp />}>Scaling Plans</SectionTitle>
            
            {customer.capacityGrowth?.scalingPlans && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
                {/* Next Upgrade */}
                {customer.capacityGrowth.scalingPlans.nextUpgrade && (
                  <Card sx={{ boxShadow: 2 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>Next Planned Upgrade</Typography>
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Type</Typography>
                          <Chip 
                            label={customer.capacityGrowth.scalingPlans.nextUpgrade.upgradeType} 
                            size="small"
                            color="primary"
                          />
                        </Box>
                        {customer.capacityGrowth.scalingPlans.nextUpgrade.plannedDate && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">Planned Date</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {new Date(customer.capacityGrowth.scalingPlans.nextUpgrade.plannedDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                        {customer.capacityGrowth.scalingPlans.nextUpgrade.triggerMetric && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">Trigger Metric</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {customer.capacityGrowth.scalingPlans.nextUpgrade.triggerMetric}
                            </Typography>
                          </Box>
                        )}
                        {customer.capacityGrowth.scalingPlans.nextUpgrade.triggerThreshold && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">Trigger Threshold</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {customer.capacityGrowth.scalingPlans.nextUpgrade.triggerThreshold}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Growth Projections */}
                {customer.capacityGrowth.scalingPlans.growthProjections && 
                 customer.capacityGrowth.scalingPlans.growthProjections.length > 0 && (
                  <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>Growth Projections</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {customer.capacityGrowth.scalingPlans.growthProjections.map((projection, index) => (
                        <Card key={index} sx={{ boxShadow: 1 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="h6" fontWeight="bold">
                                {projection.metric}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip 
                                  label={projection.timeframe} 
                                  size="small" 
                                  variant="outlined"
                                />
                                <Chip 
                                  label={projection.confidence} 
                                  size="small" 
                                  color={projection.confidence === 'high' ? 'success' : 
                                         projection.confidence === 'medium' ? 'warning' : 'default'}
                                />
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 3 }}>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Current</Typography>
                                <Typography variant="h5" fontWeight="bold" color="primary">
                                  {projection.currentValue.toLocaleString()}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Projected</Typography>
                                <Typography variant="h5" fontWeight="bold" color="warning.main">
                                  {projection.projectedValue.toLocaleString()}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Growth</Typography>
                                <Typography variant="h5" fontWeight="bold" color="success.main">
                                  +{(((projection.projectedValue - projection.currentValue) / projection.currentValue) * 100).toFixed(1)}%
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            <SectionTitle icon={<Warning />}>Resource Constraints</SectionTitle>
            
            {customer.capacityGrowth?.resourceConstraints && 
             customer.capacityGrowth.resourceConstraints.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {customer.capacityGrowth.resourceConstraints.map((constraint, index) => (
                  <Card key={index} sx={{ boxShadow: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold">
                          {constraint.type.charAt(0).toUpperCase() + constraint.type.slice(1)} Constraint
                        </Typography>
                        <Chip 
                          label={constraint.impact} 
                          size="small" 
                          color={constraint.impact === 'high' ? 'error' : 
                                 constraint.impact === 'medium' ? 'warning' : 'default'}
                        />
                      </Box>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {constraint.description}
                      </Typography>
                      {constraint.resolutionTimeline && (
                        <Typography variant="body2" color="text.secondary">
                          Resolution Timeline: {new Date(constraint.resolutionTimeline).toLocaleDateString()}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Alert severity="info">No resource constraints identified</Alert>
            )}
          </Box>
        </TabPanel>

        {/* Stakeholders Tab */}
        <TabPanel value={currentTab} index={8}>
          <Box sx={{ px: 3 }}>
            <SectionTitle icon={<Group />}>Stakeholders</SectionTitle>

            {customer.stakeholders && customer.stakeholders.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Engagement</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customer.stakeholders.map((stakeholder, index) => (
                      <TableRow key={stakeholder._id || index} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{stakeholder.name}</TableCell>
                        <TableCell>{stakeholder.title}</TableCell>
                        <TableCell>{stakeholder.department}</TableCell>
                        <TableCell>
                          <Chip 
                            label={stakeholder.stakeholderType} 
                            size="small" 
                            color={stakeholder.stakeholderType === 'primary' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={stakeholder.engagement.level} 
                            size="small" 
                            color={
                              stakeholder.engagement.level === 'high' ? 'success' : 
                              stakeholder.engagement.level === 'medium' ? 'info' : 
                              stakeholder.engagement.level === 'low' ? 'warning' : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{stakeholder.contact.email}</Typography>
                          {stakeholder.contact.phone && (
                            <Typography variant="caption" color="text.secondary">{stakeholder.contact.phone}</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No stakeholders defined for this customer</Alert>
            )}
          </Box>
        </TabPanel>

        {/* SLAs Tab */}
        <TabPanel value={currentTab} index={9}>
          <Box sx={{ px: 3 }}>
            <SectionTitle icon={<Timer />}>Service Level Agreements</SectionTitle>

            {customer.slas && customer.slas.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {customer.slas.map((sla, index) => (
                  <Card key={index} sx={{ minWidth: '250px', boxShadow: 2 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                        {sla.name}
                      </Typography>
                      <Box display="flex" alignItems="baseline" gap={1}>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                          {sla.amount}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {sla.unit}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Alert severity="info">No SLAs configured for this customer</Alert>
            )}
          </Box>
        </TabPanel>

      </Paper>
    </Box>
  );
};

export default observer(CustomerViewPage);
