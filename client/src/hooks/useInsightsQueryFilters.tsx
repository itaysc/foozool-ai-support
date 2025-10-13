import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface InsightsQueryFilters {
  customerId: string | null;
  insightId: string | null;
}

export interface UseInsightsQueryFiltersReturn {
  filters: InsightsQueryFilters;
  setCustomerFilter: (customerId: string | null) => void;
  setInsightFilter: (insightId: string | null) => void;
  clearFilters: () => void;
  clearCustomerFilter: () => void;
  clearInsightFilter: () => void;
}

/**
 * Custom hook to manage URL query parameters for the insights page
 * 
 * Manages query params:
 * - customer: Customer ID for filtering insights
 * - insightId: Insight ID for opening the drawer
 * 
 * @example
 * const { filters, setCustomerFilter, setInsightFilter } = useInsightsQueryFilters();
 * 
 * // Set customer filter
 * setCustomerFilter('customer-123');
 * 
 * // Set insight filter
 * setInsightFilter('INS-456');
 * 
 * // Clear all filters
 * clearFilters();
 */
export const useInsightsQueryFilters = (): UseInsightsQueryFiltersReturn => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State to track current filter values
  const [filters, setFilters] = useState<InsightsQueryFilters>({
    customerId: null,
    insightId: null,
  });

  // Initialize filters from URL on mount
  useEffect(() => {
    const customerId = searchParams.get('customer');
    const insightId = searchParams.get('insightId');
    
    setFilters({
      customerId: customerId || null,
      insightId: insightId || null,
    });
  }, [searchParams]);

  /**
   * Update customer filter in URL and state
   */
  const setCustomerFilter = (customerId: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (customerId) {
      newParams.set('customer', customerId);
    } else {
      newParams.delete('customer');
    }
    
    setSearchParams(newParams, { replace: true });
  };

  /**
   * Update insight filter in URL and state
   */
  const setInsightFilter = (insightId: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (insightId) {
      newParams.set('insightId', insightId);
    } else {
      newParams.delete('insightId');
    }
    
    setSearchParams(newParams, { replace: true });
  };

  /**
   * Clear all filters from URL and state
   */
  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  /**
   * Clear only customer filter
   */
  const clearCustomerFilter = () => {
    setCustomerFilter(null);
  };

  /**
   * Clear only insight filter
   */
  const clearInsightFilter = () => {
    setInsightFilter(null);
  };

  return {
    filters,
    setCustomerFilter,
    setInsightFilter,
    clearFilters,
    clearCustomerFilter,
    clearInsightFilter,
  };
};

