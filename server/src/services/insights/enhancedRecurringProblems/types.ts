// Enhanced Recurring Problems Types

export interface EnhancedRecurringProblem {
  type: 'recurring_problems';
  message: string;
  severity: 'red' | 'yellow' | 'info';
  category: 'risk' | 'upsell' | 'customer_success' | 'strategic';
  meta: {
    issue: string;
    frequency: number;
    affectedCustomers: string[];
    timeRange: string;
    errorPatterns: string[];
    businessImpact: string;
    ticketIds: string[];
    resolutionPattern: string;
    recommendation: string;
    investigationSteps: string[];
    evidence: {
      sampleTickets: Array<{
        id: string;
        subject: string;
        description: string;
        createdAt: string;
        customerId: string;
      }>;
      errorMessages: string[];
      timePattern: string;
      links?: Array<{
        label: string;
        url: string;
        type: 'log' | 'dashboard' | 'documentation' | 'ticket' | 'system' | 'other';
        description?: string;
      }>;
    };
  };
}

export interface ProblemCluster {
  pattern: string;
  tickets: any[];
  frequency: number;
  severity: 'high' | 'medium' | 'low';
  errorMessages: string[];
  timePattern: string;
  affectedCustomers: Set<string>;
  businessImpact: string;
}

export interface ProblemTheme {
  theme: string;
  tickets: any[];
}

export interface EvidenceLink {
  label: string;
  url: string;
  type: 'log' | 'dashboard' | 'documentation' | 'ticket' | 'system' | 'other';
  description?: string;
}

// Enhanced thresholds for more nuanced detection
export const ENHANCED_THRESHOLDS = {
  // Minimum tickets to consider a pattern
  MIN_PATTERN_TICKETS: 3,
  CRITICAL_PATTERN_TICKETS: 8,
  
  // Time windows for pattern analysis
  PATTERN_TIME_WINDOW_DAYS: 30,
  CRITICAL_TIME_WINDOW_DAYS: 7,
  
  // Business impact thresholds
  HIGH_IMPACT_CUSTOMERS: 3, // Number of different customers affected
  CRITICAL_IMPACT_CUSTOMERS: 5,
  
  // Resolution time patterns
  LONG_RESOLUTION_THRESHOLD_HOURS: 24,
  CRITICAL_RESOLUTION_THRESHOLD_HOURS: 72,
} as const;
