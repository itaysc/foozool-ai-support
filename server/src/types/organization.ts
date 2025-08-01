
export interface OrganizationContact {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface DashboardSettings {
  // Time period settings for analytics
  analyticsTimeRange: {
    type: 'all_time' | 'custom_days' | 'custom_months' | 'custom_years';
    value?: number; // Number of days/months/years to look back
    startDate?: string; // ISO string for custom start date
    endDate?: string; // ISO string for custom end date
  };
  
  // Dashboard refresh settings
  refreshInterval: {
    enabled: boolean;
    minutes: number; // How often to refresh dashboard data
  };
  
  // Data aggregation settings
  aggregationSettings: {
    groupBy: 'day' | 'week' | 'month' | 'quarter';
    includeHistoricalData: boolean; // Whether to include old tickets
    maxDataPoints: number; // Maximum number of data points to return
  };
  
  // Feature toggles
  features: {
    showPerformanceComparison: boolean;
    showTrendAnalysis: boolean;
    showAnomalyDetection: boolean;
    showSentimentAnalysis: boolean;
    showIntentAnalysis: boolean;
  };
  
  // Thresholds for alerts
  thresholds: {
    criticalTicketVolume: number;
    highPriorityThreshold: number;
    satisfactionAlertThreshold: number;
  };
}

export interface IOrganization {
  _id?: string;
  name: string;
  signature: string;
  details?: string;
  externalId?: string;
  groupId?: string;
  notes?: string[];
  tags?: string[];
  url?: string;
  contact?: OrganizationContact;
  domains?: string[];
  dashboardSettings?: DashboardSettings;
  createdAt?: Date;
  updatedAt?: Date;
}