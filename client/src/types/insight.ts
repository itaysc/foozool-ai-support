export interface Insight {
  clusterId: string;
  organizationId: string; // The ObjectId as a string
  issueDescription: string;
  ticketVolume: number;
  growthRate: number;
  firstDetectedAt: string; // ISO date string
  lastUpdatedAt: string; // ISO date string
}

export interface InsightSummary {
  totalInsights: number;
  totalTicketVolume: number;
  avgGrowthRate: number;
  maxGrowthRate: number;
  minGrowthRate: number;
  mostRecentUpdate: string | null;
}

export interface InsightsResponse {
  success: boolean;
  data: Insight[];
  count: number;
}

export interface InsightSummaryResponse {
  success: boolean;
  data: InsightSummary;
}