import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Alert } from '@mui/material';
import { BugReport, Analytics, Assessment, Dashboard } from '@mui/icons-material';
import { Insight, InsightSummary } from '@/types/insight';
import { Prediction, PredictionSummary, AccuracyAnalysis } from '@/types/prediction';
import { NPSInsights } from '@/types/nps';
import { CustomerSuccessInsight } from '@/types';
import { insightsService } from '@/services/insights-service';
import { surveysService } from '@/services/surveys-service';
import { useAuth } from '@/context/auth.context';
import customersStore from '@/stores/customers.store';
import botsService from '@/services/bots-service';
import { SideBar, NavItem } from '@/components/sideBar';
import { DateFilter, DateFilterState } from '@/components/insights/DateFilter';
import { 
  TicketInsightsTab, 
  PredictionsTab, 
  NPSInsightsTab, 
  CustomerSuccessTab 
} from './tabs';

const InsightsPage: React.FC = () => {
  const { organizationId: orgIdFromParams } = useParams<{ organizationId: string }>();
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ticket');
  
  // Data state
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightSummary, setInsightSummary] = useState<InsightSummary | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [predictionSummary, setPredictionSummary] = useState<PredictionSummary | null>(null);
  const [accuracyAnalysis, setAccuracyAnalysis] = useState<AccuracyAnalysis | null>(null);
  const [npsInsights, setNpsInsights] = useState<NPSInsights | null>(null);
  const [csInsights, setCsInsights] = useState<CustomerSuccessInsight[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ fromDate: null, toDate: null });

  // Get organization ID
  const getOrganizationId = (org: any): string | null => {
    if (typeof org === 'string') return org;
    if (org && typeof org === 'object' && org._id) return org._id;
    return null;
  };
  
  const effectiveOrgId = getOrganizationId(orgIdFromParams) || getOrganizationId(user?.organization);

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
    if (!effectiveOrgId) {
      setLoading(false);
      return;
    }

      try {
        await customersStore.fetchCustomers();
        const orgCustomers = customersStore.customers.filter(c => c.organizationId === effectiveOrgId);
        setCustomers(orgCustomers);
        
        if (orgCustomers.length > 0 && !selectedCustomer) {
          setSelectedCustomer(orgCustomers[0]._id);
        }
      } catch (err) {
        console.error('Error loading customers:', err);
        setError('Failed to load customers');
        setLoading(false);
        return;
      }
    };

    loadCustomers();
  }, [effectiveOrgId, selectedCustomer]);

  // Fetch customer success insights
  const fetchCustomerSuccessInsights = async (customerId: string) => {
    if (!customerId) return;
    try {
      const res = await insightsService.getCustomerSuccessInsights(customerId);
      setCsInsights(res.data || []);
    } catch (err) {
      console.error('Error fetching customer success insights:', err);
    }
  };

  // Load customer success insights when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerSuccessInsights(selectedCustomer);
    }
  }, [selectedCustomer]);

  // Main data loading
  useEffect(() => {
    const loadData = async () => {
      if (!effectiveOrgId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load insights with date filter
        const insightsRes = await insightsService.getInsightsByOrganization(effectiveOrgId, dateFilter);
        setInsights(insightsRes.data || []);
        setInsightSummary(null); // Will be loaded separately if needed

        // Load predictions
        const predictionsRes = await insightsService.getPredictions(20);
        setPredictions(predictionsRes.data || []);
        setPredictionSummary(null); // Will be loaded separately if needed
        setAccuracyAnalysis(null); // Will be loaded separately if needed

        // Load NPS insights
        try {
          const npsRes = await surveysService.getNPSInsights();
          setNpsInsights(npsRes);
        } catch (npsErr) {
          console.warn('NPS insights not available:', npsErr);
          setNpsInsights(null);
        }

      } catch (err) {
        console.error('Error loading insights data:', err);
        setError('Failed to load insights data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [effectiveOrgId]);

  // Reload data when date filter changes (only for stored insights)
  useEffect(() => {
    const reloadFilteredData = async () => {
      if (!effectiveOrgId) return;
      
      try {
        // Only reload insights that are stored in DB (ticket cluster insights, NPS, CSAT)
        if (activeTab === 'ticket' || activeTab === 'nps') {
          const insightsRes = await insightsService.getInsightsByOrganization(effectiveOrgId, dateFilter);
          setInsights(insightsRes.data || []);
        }
      } catch (err) {
        console.error('Error reloading filtered data:', err);
      }
    };

    reloadFilteredData();
  }, [dateFilter, effectiveOrgId, activeTab]);

  // Determine visible navigation items based on data or configured bots
  const navItems: NavItem[] = [
    { id: 'ticket', label: 'Ticket Insights', icon: <BugReport />, visible: true },
    { id: 'pred', label: 'Predictions', icon: <Analytics />, visible: true },
    { id: 'nps', label: 'NPS Insights', icon: <Assessment />, visible: true },
    { id: 'cs', label: 'Customer Success', icon: <Dashboard />, visible: true }
  ];

  // Tab change handler
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Customer change handler
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId);
  };

  // Date filter change handler
  const handleDateFilterChange = (filter: DateFilterState) => {
    setDateFilter(filter);
  };

  // Refresh handler
  const refreshInsights = async () => {
    if (!effectiveOrgId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Reload all data with current date filter
      const insightsRes = await insightsService.getInsightsByOrganization(effectiveOrgId, dateFilter);
      setInsights(insightsRes.data || []);
      setInsightSummary(null);

      const predictionsRes = await insightsService.getPredictions(20);
      setPredictions(predictionsRes.data || []);
      setPredictionSummary(null);
      setAccuracyAnalysis(null);

      try {
        const npsRes = await surveysService.getNPSInsights();
        setNpsInsights(npsRes);
      } catch (npsErr) {
        console.warn('NPS insights not available:', npsErr);
        setNpsInsights(null);
      }

      // Refresh customer success insights if customer is selected
      if (selectedCustomer) {
        await fetchCustomerSuccessInsights(selectedCustomer);
      }

    } catch (err) {
      console.error('Error refreshing insights:', err);
      setError('Failed to refresh insights data');
    } finally {
      setLoading(false);
    }
  };

  // Ensure active tab is valid
  const validTabs = navItems.filter(item => item.visible).map(item => item.id);
  if (!validTabs.includes(activeTab) && validTabs.length > 0) {
    setActiveTab(validTabs[0]);
  }

  if (loading && !insights.length && !predictions.length) {
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

  if (error && !insights.length && !predictions.length) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      '& @keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
      }
    }}>
      <SideBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        navItems={navItems}
      />

          <Box sx={{ 
        p: 3,
        marginLeft: '280px', // Account for fixed sidebar width
        overflow: 'auto'
      }}>
        {/* Date Filter - only show for tabs with stored insights */}
        {(activeTab === 'ticket' || activeTab === 'nps') && (
          <DateFilter
            onFilterChange={handleDateFilterChange}
            label={`Filter ${activeTab === 'ticket' ? 'Ticket Cluster' : 'NPS'} Insights by Date`}
          />
        )}
        {activeTab === 'ticket' && (
          <TicketInsightsTab
            insights={insights}
            insightSummary={insightSummary}
            loading={loading}
            error={error}
            onRefresh={refreshInsights}
          />
        )}

        {activeTab === 'pred' && (
          <PredictionsTab
            predictions={predictions}
            predictionSummary={predictionSummary}
            accuracyAnalysis={accuracyAnalysis}
            loading={loading}
            error={error}
            onRefresh={refreshInsights}
          />
        )}

        {activeTab === 'nps' && (
          <NPSInsightsTab
            npsInsights={npsInsights}
            loading={loading}
            error={error}
            onRefresh={refreshInsights}
          />
        )}

        {activeTab === 'cs' && (
          <CustomerSuccessTab
            csInsights={csInsights}
            selectedCustomer={selectedCustomer}
            customers={customers}
            loading={loading}
            error={error}
            onRefresh={refreshInsights}
            onCustomerChange={handleCustomerChange}
          />
        )}
      </Box>
    </Box>
  );
};

export default InsightsPage;
