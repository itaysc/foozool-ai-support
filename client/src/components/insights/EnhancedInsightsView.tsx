import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  IconButton,
  useMediaQuery,
  useTheme,
  Alert,
  alpha,
  Paper
} from '@mui/material';
import { FilterList, Refresh, TrendingUp, Analytics } from '@mui/icons-material';
import { CustomerSuccessInsight } from '@/types/customerSuccess';
import InsightSummaryCard from './InsightSummaryCard';
import InsightFilterPanel from './InsightFilterPanel';
import InsightsTable from './InsightsTable';
import InsightDetailDrawer from './InsightDetailDrawer';
import { insightsService } from '@/services/insights-service';

interface EnhancedInsightsViewProps {
  insights: CustomerSuccessInsight[];
  loading?: boolean;
  onRefresh?: () => void;
  selectedCustomer?: string | null;
  customers?: any[];
  onCustomerChange?: (customerId: string) => void;
}

const EnhancedInsightsView: React.FC<EnhancedInsightsViewProps> = ({
  insights,
  loading = false,
  onRefresh,
  selectedCustomer,
  customers = [],
  onCustomerChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<CustomerSuccessInsight | null>(null);
  const [users, setUsers] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [selectedSummaryCard, setSelectedSummaryCard] = useState<'critical' | 'warning' | 'info' | 'total' | null>('total');
  
  const [filters, setFilters] = useState({
    severity: ['red', 'yellow', 'info'],
    category: ['risk', 'upsell', 'customer_success', 'strategic'],
    timeRange: '30d',
    status: ['new', 'in_progress', 'resolved', 'closed', 'reopened'],
    assignee: ['unassigned']
  });

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await insightsService.getUsers();
        if (response.success) {
          const formattedUsers = response.data.map(user => ({
            _id: user._id,
            name: user.fullName || `${user.firstName} ${user.lastName}`,
            email: user.email
          }));
          setUsers(formattedUsers);
          // Update assignee filter to include all users
          setFilters(prev => ({
            ...prev,
            assignee: ['unassigned', ...formattedUsers.map(user => user._id)]
          }));
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Sync selected summary card with filter changes
  useEffect(() => {
    const severityFilters = filters.severity;
    
    if (severityFilters.length === 1) {
      if (severityFilters.includes('red')) {
        setSelectedSummaryCard('critical');
      } else if (severityFilters.includes('yellow')) {
        setSelectedSummaryCard('warning');
      } else if (severityFilters.includes('info')) {
        setSelectedSummaryCard('info');
      }
    } else if (severityFilters.length === 3 && 
               severityFilters.includes('red') && 
               severityFilters.includes('yellow') && 
               severityFilters.includes('info')) {
      setSelectedSummaryCard('total');
    } else if (severityFilters.length === 0) {
      // If no severities are selected, default to total
      setSelectedSummaryCard('total');
      setFilters(prev => ({ ...prev, severity: ['red', 'yellow', 'info'] }));
    } else {
      // For multiple selections (but not all three), clear selection
      setSelectedSummaryCard(null);
    }
  }, [filters.severity]);

  // Filter insights based on current filters
  const filteredInsights = useMemo(() => {
    return insights.filter(insight => {
      // Check severity filter
      if (!filters.severity.includes(insight.severity)) return false;
      
      // Check category filter
      if (!filters.category.includes(insight.category)) return false;
      
      // Check status filter
      const insightStatus = insight.status || 'new';
      if (!filters.status.includes(insightStatus)) return false;
      
      // Check assignee filter
      const insightAssignee = insight.assignee || 'unassigned';
      if (!filters.assignee.includes(insightAssignee)) return false;
      
      return true;
    });
  }, [insights, filters]);

  // Calculate summary statistics (always from all insights, not filtered)
  const summaryStats = useMemo(() => {
    const stats = {
      total: insights.length,
      critical: insights.filter(i => i.severity === 'red').length,
      warning: insights.filter(i => i.severity === 'yellow').length,
      info: insights.filter(i => i.severity === 'info').length
    };
    
    return stats;
  }, [insights]);

  const handleInsightSelect = (insight: CustomerSuccessInsight) => {
    setSelectedInsight(insight);
    setDetailDrawerOpen(true);
  };

  const handleCloseDetailDrawer = () => {
    setDetailDrawerOpen(false);
    setSelectedInsight(null);
  };

  // Helper function to determine card selection states
  const getCardSelectionStates = () => {
    const severityFilters = filters.severity;
    const hasAllSeverities = severityFilters.length === 3 && 
                            severityFilters.includes('red') && 
                            severityFilters.includes('yellow') && 
                            severityFilters.includes('info');
    
    return {
      critical: {
        isSelected: selectedSummaryCard === 'critical',
        isPartiallySelected: false // No partial selection in radio button mode
      },
      warning: {
        isSelected: selectedSummaryCard === 'warning',
        isPartiallySelected: false // No partial selection in radio button mode
      },
      info: {
        isSelected: selectedSummaryCard === 'info',
        isPartiallySelected: false // No partial selection in radio button mode
      },
      total: {
        isSelected: selectedSummaryCard === 'total',
        isPartiallySelected: false // No partial selection in radio button mode
      }
    };
  };

  const handleSummaryCardClick = (cardType: 'critical' | 'warning' | 'info' | 'total') => {
    // Radio button behavior - only one can be selected at a time
    setSelectedSummaryCard(cardType);
    
    // Update filters based on selected card (single selection only)
    switch (cardType) {
      case 'critical':
        setFilters(prev => ({ ...prev, severity: ['red'] }));
        break;
      case 'warning':
        setFilters(prev => ({ ...prev, severity: ['yellow'] }));
        break;
      case 'info':
        setFilters(prev => ({ ...prev, severity: ['info'] }));
        break;
      case 'total':
        setFilters(prev => ({ ...prev, severity: ['red', 'yellow', 'info'] }));
        break;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography>Loading insights...</Typography>
      </Box>
    );
  }

  if (insights.length === 0) {
    return (
      <Alert severity="info">
        No insights available. Generate insights to see AI-powered analysis.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header with Summary and Controls */}
      <Paper sx={{
        p: 1.5,
        mb: 2,
        borderRadius: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              p: 0.75,
              borderRadius: 1.5,
              backgroundColor: alpha('#ffffff', 0.2),
              color: 'white'
            }}>
              <Analytics sx={{ fontSize: 18 }} />
            </Box>
            <Typography variant="h5" sx={{ 
              fontWeight: 700,
              fontSize: '1.5rem'
            }}>
              Insights Overview
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton 
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              size="small"
              sx={{ 
                backgroundColor: filterPanelOpen ? alpha('#ffffff', 0.2) : alpha('#ffffff', 0.1),
                color: 'white',
                '&:hover': {
                  backgroundColor: alpha('#ffffff', 0.2)
                }
              }}
            >
              <FilterList sx={{ fontSize: 18 }} />
            </IconButton>
            
            {onRefresh && (
              <IconButton 
                onClick={onRefresh}
                size="small"
                sx={{ 
                  backgroundColor: alpha('#ffffff', 0.1),
                  color: 'white',
                  '&:hover': {
                    backgroundColor: alpha('#ffffff', 0.2)
                  }
                }}
              >
                <Refresh sx={{ fontSize: 18 }} />
              </IconButton>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Summary Cards */}
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        mb: 2,
        width: '100%'
      }}>
        <Box sx={{ flex: 1, height: 80 }}>
          <InsightSummaryCard
            title="Critical"
            count={summaryStats.critical}
            severity="red"
            subtitle="Requires immediate attention"
            isSelected={getCardSelectionStates().critical.isSelected}
            isPartiallySelected={getCardSelectionStates().critical.isPartiallySelected}
            onClick={() => handleSummaryCardClick('critical')}
          />
        </Box>
        <Box sx={{ flex: 1, height: 80 }}>
          <InsightSummaryCard
            title="Warning"
            count={summaryStats.warning}
            severity="yellow"
            subtitle="Monitor closely"
            isSelected={getCardSelectionStates().warning.isSelected}
            isPartiallySelected={getCardSelectionStates().warning.isPartiallySelected}
            onClick={() => handleSummaryCardClick('warning')}
          />
        </Box>
        <Box sx={{ flex: 1, height: 80 }}>
          <InsightSummaryCard
            title="Info"
            count={summaryStats.info}
            severity="info"
            subtitle="Good to know"
            isSelected={getCardSelectionStates().info.isSelected}
            isPartiallySelected={getCardSelectionStates().info.isPartiallySelected}
            onClick={() => handleSummaryCardClick('info')}
          />
        </Box>
        <Box sx={{ flex: 1, height: 80 }}>
          <InsightSummaryCard
            title="Total"
            count={summaryStats.total}
            severity="info"
            subtitle="All insights"
            isSelected={getCardSelectionStates().total.isSelected}
            isPartiallySelected={getCardSelectionStates().total.isPartiallySelected}
            onClick={() => handleSummaryCardClick('total')}
          />
        </Box>
      </Box>

      {/* Insights Table - Full Width */}
      <Box>
        {filteredInsights.length === 0 ? (
          <Paper sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 2,
            background: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)'
          }}>
            <Box sx={{
              p: 1.5,
              borderRadius: '50%',
              backgroundColor: alpha('#3b82f6', 0.1),
              color: '#3b82f6',
              display: 'inline-flex',
              mb: 1.5
            }}>
              <TrendingUp sx={{ fontSize: 24 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, color: '#374151' }}>
              No insights match your filters
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Try adjusting your filter settings to see more insights
            </Typography>
          </Paper>
        ) : (
          <Box>
            <InsightsTable
                insights={filteredInsights}
                onInsightSelect={handleInsightSelect}
                selectedCustomer={selectedCustomer}
                customers={customers}
                onCustomerChange={onCustomerChange}
              />
          </Box>
        )}
      </Box>

      {/* Filter Panel */}
      <InsightFilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        users={users}
      />

      {/* Detail Drawer */}
      <InsightDetailDrawer
        open={detailDrawerOpen}
        onClose={handleCloseDetailDrawer}
        insight={selectedInsight}
      />
    </Box>
  );
};

export default EnhancedInsightsView;
