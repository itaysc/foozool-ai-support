// Types and interfaces for insights services

export interface DateFilter {
  fromDate?: string;
  toDate?: string;
}

export interface InsightsQueryResult {
  success: boolean;
  data: any[];
  count: number;
}

export interface InsightsSummaryResult {
  success: boolean;
  data: {
    totalInsights: number;
    totalTicketVolume: number;
    avgGrowthRate: number;
    maxGrowthRate: number;
    minGrowthRate: number;
    mostRecentUpdate: Date | null;
  };
}

export interface CustomerSuccessInsightsResult {
  status: number;
  payload?: {
    freshInsights: any[];
    savedInsights: any[];
    allInsights: any[];
  };
  error?: string;
}

export interface AllCustomerSuccessInsightsResult {
  status: number;
  payload?: Array<{ customerId: string; customerName?: string; insights: any[] }>;
  error?: string;
}

export interface MeetingPrepResult {
  pdfDoc: any;
  filename: string;
}

